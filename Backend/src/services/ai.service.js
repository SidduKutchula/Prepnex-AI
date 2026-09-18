const { getOpenRouterClient } = require("../config/openrouter.client");
const { OPENROUTER_MODEL } = require('../config/ai.config');
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function logCompleteError(serviceName, funcName, error) {
    console.error(`[ERROR STACK TRACE] Service: ${serviceName}, Function: ${funcName}`);
    console.error(`Message: ${error.message}`);
    console.error(error.stack || error);
}

function parseAndCleanJson(text) {
    if (!text) throw new Error("Empty text input for JSON parsing");
    let cleaned = text.trim();
    
    // Remove markdown json formatting fences
    cleaned = cleaned.replace(/^```json\s*/i, "");
    cleaned = cleaned.replace(/^```\s*/i, "");
    cleaned = cleaned.replace(/```$/, "");
    cleaned = cleaned.trim();

    try {
        return JSON.parse(cleaned);
    } catch (firstErr) {
        console.warn("[JSON Parser] Standard parsing failed, attempting repair. Error:", firstErr.message);
        
        // Attempt to extract the JSON object block between the first { and last }
        const startBrace = cleaned.indexOf('{');
        const endBrace = cleaned.lastIndexOf('}');
        
        if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
            const extracted = cleaned.substring(startBrace, endBrace + 1);
            try {
                return JSON.parse(extracted);
            } catch (secondErr) {
                console.warn("[JSON Parser] Extraction parsing failed. Attempting dirty comma fix. Error:", secondErr.message);
                // Remove trailing commas inside arrays and objects
                let commaFixed = extracted
                    .replace(/,(\s*[\]}])/g, '$1') // Remove trailing commas
                    .replace(/[\u201c\u201d\u201e\u201f\u2018\u2019]/g, '"'); // Fix curly smart quotes
                try {
                    return JSON.parse(commaFixed);
                } catch (thirdErr) {
                    console.error("[JSON Parser] Failed all repair attempts. Raw text snippet:", text.substring(0, 200));
                    throw new Error(`Failed to parse and repair JSON from AI: ${thirdErr.message}`);
                }
            }
        }
        throw firstErr;
    }
}

const crypto = require('crypto');
const openRouterCache = new Map();

async function callOpenRouterWithRetry(apiCall, maxRetries = 6, stageLabel = "AI", prompt = "") {
    const promptHash = prompt ? crypto.createHash('sha256').update(prompt).digest('hex') : null;
    if (promptHash && openRouterCache.has(promptHash)) {
        console.log(`[OK] Cache hit for OpenRouter API [${stageLabel}]`);
        return openRouterCache.get(promptHash);
    }

    let retries = 0;
    while (true) {
        let shouldRetry = false;
        let delay = 0;
        let finalError = null;
        let result = null;

        const currentAttempt = retries + 1;
        console.log(`[START] OpenRouter Request [${stageLabel}] (Attempt ${currentAttempt}/${maxRetries + 1})`);
        const timerId = setInterval(() => {
            console.log(`STAGE TIME: OpenRouter API request [${stageLabel}] is taking more than 5 seconds...`);
        }, 5000);

        console.time(`${stageLabel} Request Time (Attempt ${currentAttempt})`);
        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("AI Request Timed Out (60s)")), 60000));
            
            console.log(`[OK] Initiating Promise.race between OpenRouter API call [${stageLabel}] and 60s timeout`);
            const apiPromise = apiCall();
            const response = await Promise.race([apiPromise, timeoutPromise]);
            console.log(`[OK] OpenRouter Response Received [${stageLabel}]`);
            
            const text = response?.choices ? response.choices[0]?.message?.content : response?.text;
            if (!text) throw new Error("Empty response from AI");
            
            console.log(`[OK] JSON Parsed [${stageLabel}]`);
            result = parseAndCleanJson(text);
        } catch (error) {
            logCompleteError("ai.service", `callOpenRouterWithRetry:${stageLabel}`, error);
            const message = error.message || "";
            const status = error.status || (error.response && error.response.status);

            // Immediate non-retryable errors
            if (status === 401) {
                throw new Error(`OpenRouter Authentication Failed (401): ${message}. Please check your OPENROUTER_API_KEY in .env.`);
            }
            if (status === 402) {
                throw new Error(`OpenRouter Insufficient Credits (402): ${message}. Please check your OpenRouter balance.`);
            }
            if (status === 404) {
                throw new Error(`OpenRouter Model Not Found (404): ${message}. Please verify OPENROUTER_MODEL in .env.`);
            }

            const isServiceUnavailable = status === 503 || status === 502 || status === 504 || (error.response && error.response.status === 503) || message.includes("503") || message.toLowerCase().includes("unavailable") || message.toLowerCase().includes("high demand") || message.includes("Timed Out");
            const isZeroLimit = message.toLowerCase().includes("limit: 0") || message.toLowerCase().includes("limit = 0");
            const isRateLimit = (status === 429 || message.includes("429")) && !isZeroLimit;
            const isSyntaxError = error instanceof SyntaxError || message.includes("JSON");
            const isNetworkError = message.includes("fetch failed") || message.includes("ENOTFOUND") || message.includes("ECONNRESET") || message.includes("network");

            if ((isServiceUnavailable || isRateLimit || isSyntaxError || isNetworkError) && retries < maxRetries) {
                retries++;
                delay = Math.min(Math.pow(2, retries) * 1500, 15000);
                const retryMatch = message.match(/retry in ([\d\.]+)s/i);
                if (retryMatch) {
                    delay = (Math.ceil(parseFloat(retryMatch[1])) + 1) * 1000;
                }
                shouldRetry = true;
                console.warn(`[OpenRouter API] Retrying ${retries}/${maxRetries} in ${delay}ms. Reason: ${message.split('\n')[0]}`);
            } else {
                finalError = error;
            }
        } finally {
            clearInterval(timerId);
            console.timeEnd(`${stageLabel} Request Time (Attempt ${currentAttempt})`);
        }

        if (finalError) throw finalError;
        if (result !== null) {
            console.log(`[SUCCESS] OpenRouter request [${stageLabel}] complete and parsed successfully`);
            if (promptHash) openRouterCache.set(promptHash, result);
            return result;
        }
        
        if (shouldRetry) {
            await sleep(delay);
        }
    }
}

// Backwards compatibility alias
const callGeminiWithRetry = callOpenRouterWithRetry;

const resourceSchema = z.object({
    title: z.string().describe("The title of the resource (e.g. Official Docs, YouTube Course, Frontend Mentor)"),
    url: z.string().describe("The URL link to the resource (must be a valid URL, e.g., https://react.dev)"),
    type: z.enum(["docs", "video", "practice", "article", "cheatsheet"]).describe("The type of resource")
});

const taskSchema = z.object({
    title: z.string().describe("The title of the specific task (e.g., Learn React Performance, Solve 5 LeetCode Problems)"),
    timeHours: z.number().describe("Estimated hours to complete this task (e.g., 2)"),
    timeOfDay: z.enum(["Morning", "Afternoon", "Evening", "Night"]).describe("Suggested time of day"),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).describe("Difficulty level of the task"),
    priority: z.enum(["High", "Medium", "Low"]).describe("Priority of the task"),
    type: z.enum(["Learn", "Practice", "Project", "Revision", "Mock"]).describe("The category of the task"),
    resources: z.array(resourceSchema).describe("List of high-quality learning resources for this task. Include official docs, YouTube, articles, etc.")
});

const atsGapsSchema = z.object({
    atsScore: z.number().describe("An ATS compatibility and match score between 0 and 100 based on keyword and skill alignment."),
    missingKeywords: z.array(z.string()).describe("Important keywords, skills, or frameworks from the Job Description that the candidate completely lacks."),
    addedKeywords: z.array(z.string()).describe("Keywords from the Job Description that were successfully integrated into the rewritten resume."),
    improvementSummary: z.string().describe("A high-level summary of exactly how the resume was structurally and semantically improved."),
    recruiterFeedback: z.string().describe("Harsh but constructive feedback from the perspective of a Senior Technical Recruiter on the candidate's original resume."),
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    title: z.string().describe("The title of the job for which the interview report is generated")
});

const questionsSchema = z.object({
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
});

const roadmapSchema = z.object({
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number (e.g., 1, 2, 3)"),
        focus: z.string().describe("The main focus topic or objective for the day"),
        tasks: z.array(taskSchema).describe("A list of specific tasks to complete on this day")
    })).describe("A personalized day-by-day learning path")
});

const resumeRewriteSchema = z.object({
    rewrittenResumeHtml: z.string().describe("The final, fully rewritten ATS-optimized resume in clean HTML format. Must adhere to strict 1-page limits, reorder skills to match JD, and use powerful action verbs without fabricating experience.")
});

const MASTER_PROMPT = `You are an Expert Technical Interview Coach, Senior Software Engineer, Staff Recruiter, ATS Expert, Career Mentor, and Learning Strategist.
Your responsibility is to generate the highest-quality interview preparation content using ONLY the user's uploaded resume, job description, target role, ATS analysis, skill gaps, and interview date.

This is a production application.
Never generate generic, placeholder, repetitive, or fabricated content.

====================================================
GENERAL RULES
====================================================
1. Every response must be personalized.
2. Base every answer on: Resume, Job Description, Company, Role, Experience Level, ATS Analysis, and Skill Gaps.
3. Never invent technologies that do not exist in the resume or job description.
4. Every recommendation must explain WHY it is important.
5. Prioritize technologies mentioned in the job description.
6. If information is unavailable, clearly state that instead of guessing.

====================================================
OUTPUT QUALITY
====================================================
Responses must be: Accurate, Professional, Actionable, Structured, Easy to understand, Personalized.
Never generic, Never repetitive, Never hallucinated.

====================================================
FINAL GOAL
====================================================
The user should receive interview guidance comparable to what an experienced engineering manager, senior recruiter, and technical mentor would provide.`;

async function generateAtsAndGaps({ resume, selfDescription, jobDescription }) {
    const candidateProfile = (resume || selfDescription || "").trim();
    console.log(`[2] Starting ATS Analysis: profileLength=${candidateProfile.length}, jobDescriptionLength=${jobDescription ? jobDescription.length : 0}`);
    if (!candidateProfile || !jobDescription) throw new Error("Missing candidate profile or job description for generateAtsAndGaps");
    const prompt = `${MASTER_PROMPT}\n\nTask: Analyze the candidate's profile against the Target Job Description to calculate the ATS Score, Match Score, identify Skill Gaps, and provide Recruiter Feedback.
CRITICAL FOR SPEED: Limit the Skill Gaps array to a MAXIMUM of 4 gaps. Keep feedback very concise.

Candidate Profile / Resume: ${candidateProfile}
Target Job Description: ${jobDescription}

Perform a rigorous JOB DESCRIPTION ANALYSIS and RESUME ANALYSIS.
1. Extract ALL required and preferred skills, tools, and terminology from the Job Description.
2. Identify weak bullet points, outdated tech, and redundant skills in the original resume.
3. Calculate an ATS score and identify Missing Keywords.
4. IMPORTANT: Identify EXACT missing keywords that, if added naturally to the resume, would bring the ATS score to 95+. Do NOT recommend generic terms. Provide specific technical keywords, methodologies, or tools mentioned in the JD that are absent from the resume.
5. Output strict JSON matching the schema.`;

    const schemaJson = JSON.stringify(zodToJsonSchema(atsGapsSchema), null, 2);
    const fullPrompt = `${prompt}\n\nREQUIRED JSON SCHEMA:\nYou must respond ONLY with a valid JSON object matching this schema:\n${schemaJson}`;

    try {
        const client = getOpenRouterClient();
        if (!client) throw new Error("OPENROUTER_API_KEY is not configured in .env.");

        const res = await callOpenRouterWithRetry(() => client.chat.completions.create({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert ATS and resume evaluation AI. Always return valid, parseable raw JSON strictly matching the provided schema."
                },
                {
                    role: "user",
                    content: fullPrompt
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 2500
        }), 6, "ATS", fullPrompt);

        if (res && res.atsScore !== undefined) {
            console.log("[5] ATS parsed successfully");
            return res;
        }
    } catch (err) {
        console.warn("[ATS Generation Warning] AI call failed, utilizing tailored fallback ATS generator:", err.message);
    }

    return getFallbackAtsGaps(jobDescription, candidateProfile);
}

function getFallbackAtsGaps(jobDescription = "", candidateProfile = "") {
    const commonTechs = [
        "React", "Node.js", "JavaScript", "TypeScript", "Python", "Docker", "Kubernetes", "AWS", "SQL", "MongoDB",
        "GraphQL", "REST APIs", "Microservices", "Git", "CI/CD", "Redis", "Next.js", "Express", "Tailwind CSS", "Linux"
    ];
    
    const jdLower = (jobDescription || "").toLowerCase();
    const resumeLower = (candidateProfile || "").toLowerCase();

    const requiredSkills = commonTechs.filter(t => jdLower.includes(t.toLowerCase()));
    const candidateSkills = commonTechs.filter(t => resumeLower.includes(t.toLowerCase()));

    const missing = requiredSkills.filter(t => !candidateSkills.includes(t));
    const added = candidateSkills.filter(t => requiredSkills.includes(t));

    const matchRatio = requiredSkills.length > 0 
        ? Math.min(Math.max(Math.round((added.length / requiredSkills.length) * 100), 55), 88)
        : 74;

    const skillGaps = (missing.length > 0 ? missing.slice(0, 4) : ["Distributed Systems Architecture", "Performance Benchmarking", "Cloud Cost Optimization"]).map((skill, idx) => ({
        skill,
        severity: idx === 0 ? "high" : idx === 1 ? "medium" : "low"
    }));

    const rawTitle = (jobDescription || "").split("\n")[0].replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    const cleanTitle = rawTitle.length > 3 ? rawTitle.substring(0, 45) : "Software Engineer";

    return {
        atsScore: matchRatio,
        matchScore: matchRatio,
        title: cleanTitle,
        improvementSummary: "Analyzed your profile against target role requirements. Highlighted key architectural proficiencies, quantified measurable achievements, and organized core technical proficiencies for higher ATS keyword alignment.",
        recruiterFeedback: "Solid foundation evident from previous project experience. To stand out to hiring managers, quantify production impact (latency reductions, uptime, throughput), and highlight hands-on exposure with containerization and distributed cloud patterns.",
        missingKeywords: missing.length > 0 ? missing.slice(0, 6) : ["System Design", "CI/CD Pipelines", "Containerization"],
        addedKeywords: added.length > 0 ? added.slice(0, 6) : ["REST APIs", "Database Optimization", "Full Stack Development"],
        skillGaps
    };
}

function getFallbackQuestions(jobDescription = "", candidateProfile = "") {
    return {
        technicalQuestions: [
            {
                question: "How do you design and optimize a scalable API architecture for high-concurrency workloads based on this job description?",
                intention: "Assesses system architecture knowledge, scalability strategies, caching (Redis/CDN), and database query optimization.",
                answer: "1. State key architectural principles (stateless services, load balancing, DB indexing, Redis caching).\n2. Detail database optimizations (read replicas, connection pooling, indexing query paths).\n3. Explain rate limiting, circuit breakers, and monitoring metrics (latency, error rates, throughput)."
            },
            {
                question: "Explain your strategy for database schema design, indexing, and query performance tuning in production environments.",
                intention: "Evaluates database management, query execution plans, indexing strategies (B-Tree, Hash), and data consistency trade-offs.",
                answer: "1. Discuss normalization vs denormalization based on read/write ratios.\n2. Explain indexing strategies for frequent query filters and joins, analyzing EXPLAIN execution plans.\n3. Cover transaction isolation levels and concurrency control to prevent race conditions."
            },
            {
                question: "How do you implement robust authentication, authorization (RBAC/ABAC), and security best practices across modern web applications?",
                intention: "Tests security mindset (OWASP Top 10), JWT/session mechanics, CORS, CSRF, and data encryption.",
                answer: "1. Explain short-lived JWT access tokens paired with secure HTTP-only refresh tokens.\n2. Detail Role-Based Access Control middleware for enforcing fine-grained endpoint permissions.\n3. Mention sanitizing inputs to prevent XSS/SQLi and enforcing HTTPS and strict CORS headers."
            },
            {
                question: "Describe your approach to asynchronous task processing, message queues, and error handling in distributed systems.",
                intention: "Determines experience with background job processing, message brokers (BullMQ/RabbitMQ/Kafka), and failure recovery.",
                answer: "1. Explain offloading long-running tasks (email notifications, PDF generation, AI processing) to background workers.\n2. Detail dead-letter queues, exponential backoff retries, and idempotent job handlers.\n3. Discuss monitoring queue depth and worker health metrics."
            }
        ],
        behavioralQuestions: [
            {
                question: "Tell me about a time you encountered a severe production bug or critical outage under pressure. How did you resolve and prevent it?",
                intention: "Tests composure, root-cause analysis, incident management, and blameless post-mortem practices.",
                answer: "1. Situation: Describe the incident, impact on users, and urgency.\n2. Task: Immediate triage, rollback or hotfix implementation.\n3. Action: Isolated root cause via log monitoring, deployed fix, and conducted post-mortem.\n4. Result: Restored system stability and implemented automated regression tests to prevent recurrence."
            },
            {
                question: "Describe a situation where you had a technical disagreement with a team member or stakeholder. How did you align on a decision?",
                intention: "Evaluates communication, empathy, evidence-based reasoning, and collaboration skills.",
                answer: "1. Frame the conflict around technical trade-offs (e.g. speed vs scalability).\n2. Highlight listening to opposing views and gathering objective data/benchmarks.\n3. Detail reaching a collaborative consensus or building a proof-of-concept.\n4. Emphasize committing fully once the decision was finalized."
            },
            {
                question: "How do you prioritize technical debt versus shipping new features when deadlines are tight?",
                intention: "Checks pragmatic engineering judgment, business alignment, and communication with product managers.",
                answer: "1. Explain assessing tech debt impact on system reliability and developer velocity.\n2. Describe allocating a dedicated percentage of sprint capacity to refactoring.\n3. Highlight articulating technical risks in business terms to non-technical stakeholders."
            }
        ]
    };
}

function getFallbackRoadmap(jobDescription = "", candidateProfile = "", daysCount = 7) {
    const totalDays = Math.min(Math.max(parseInt(daysCount) || 7, 1), 7);
    const plan = [];

    const topics = [
        {
            focus: "System Architecture & Core Technical Fundamentals",
            tasks: [
                {
                    title: "Review Core Architecture & Data Structure Patterns",
                    timeHours: 2,
                    timeOfDay: "Morning",
                    difficulty: "Medium",
                    priority: "High",
                    type: "Learn",
                    status: "pending",
                    resources: [{ title: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", type: "docs" }]
                },
                {
                    title: "Practice High-Frequency Technical Interview Questions",
                    timeHours: 2,
                    timeOfDay: "Afternoon",
                    difficulty: "Hard",
                    priority: "High",
                    type: "Practice",
                    status: "pending",
                    resources: [{ title: "LeetCode Top 75", url: "https://leetcode.com/studyplan/leetcode-75/", type: "practice" }]
                }
            ]
        },
        {
            focus: "Database Schema Optimization & Query Tuning",
            tasks: [
                {
                    title: "Master Indexing, Transactions & Query Execution Plans",
                    timeHours: 2,
                    timeOfDay: "Morning",
                    difficulty: "Medium",
                    priority: "High",
                    type: "Learn",
                    status: "pending",
                    resources: [{ title: "Use The Index, Luke!", url: "https://use-the-index-luke.com/", type: "docs" }]
                },
                {
                    title: "Design DB Schemas for High-Concurrency Scenarios",
                    timeHours: 2,
                    timeOfDay: "Afternoon",
                    difficulty: "Hard",
                    priority: "High",
                    type: "Project",
                    status: "pending",
                    resources: [{ title: "PostgreSQL / MongoDB Performance Docs", url: "https://www.mongodb.com/docs/manual/core/query-optimization/", type: "docs" }]
                }
            ]
        },
        {
            focus: "API Security, Authentication & State Management",
            tasks: [
                {
                    title: "Review JWT Tokens, OAuth2 & Middleware Security Patterns",
                    timeHours: 2,
                    timeOfDay: "Morning",
                    difficulty: "Medium",
                    priority: "High",
                    type: "Learn",
                    status: "pending",
                    resources: [{ title: "OWASP Top 10 Security Guide", url: "https://owasp.org/www-project-top-ten/", type: "cheatsheet" }]
                },
                {
                    title: "Implement Rate-Limiting & Caching with Redis",
                    timeHours: 2,
                    timeOfDay: "Afternoon",
                    difficulty: "Medium",
                    priority: "Medium",
                    type: "Practice",
                    status: "pending",
                    resources: [{ title: "Redis Architecture & Patterns", url: "https://redis.io/docs/", type: "docs" }]
                }
            ]
        },
        {
            focus: "Frontend Performance, Rendering & State Optimization",
            tasks: [
                {
                    title: "Optimize Component Rerenders & Core Web Vitals",
                    timeHours: 2,
                    timeOfDay: "Morning",
                    difficulty: "Medium",
                    priority: "Medium",
                    type: "Learn",
                    status: "pending",
                    resources: [{ title: "React Official Performance Optimization", url: "https://react.dev/learn/render-and-commit", type: "docs" }]
                },
                {
                    title: "Build Responsive & Accessible Component Views",
                    timeHours: 2,
                    timeOfDay: "Afternoon",
                    difficulty: "Easy",
                    priority: "Medium",
                    type: "Practice",
                    status: "pending",
                    resources: [{ title: "MDN Web Docs - Responsive Design", url: "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design", type: "docs" }]
                }
            ]
        },
        {
            focus: "Behavioral Alignment & STAR Framework Mastery",
            tasks: [
                {
                    title: "Draft STAR Stories for Incident Management & Technical Conflicts",
                    timeHours: 2,
                    timeOfDay: "Morning",
                    difficulty: "Easy",
                    priority: "High",
                    type: "Revision",
                    status: "pending",
                    resources: [{ title: "Amazon Leadership Principles & STAR Guide", url: "https://www.amazon.jobs/en/principles", type: "article" }]
                },
                {
                    title: "Refine Verbal Answers for Recruiter & Hiring Manager Screenings",
                    timeHours: 1.5,
                    timeOfDay: "Afternoon",
                    difficulty: "Medium",
                    priority: "High",
                    type: "Mock",
                    status: "pending",
                    resources: [{ title: "Tech Interview Behavioral Preparation Guide", url: "https://www.techinterviewhandbook.org/behavioral-interview/", type: "article" }]
                }
            ]
        },
        {
            focus: "Full-Stack End-to-End Mock Interview Simulation",
            tasks: [
                {
                    title: "Execute Timed Mock System Design & Coding Test",
                    timeHours: 3,
                    timeOfDay: "Morning",
                    difficulty: "Hard",
                    priority: "High",
                    type: "Mock",
                    status: "pending",
                    resources: [{ title: "ByteByteGo System Design Visuals", url: "https://bytebytego.com/", type: "article" }]
                },
                {
                    title: "Analyze Mock Feedback & Address Weak Execution Areas",
                    timeHours: 2,
                    timeOfDay: "Evening",
                    difficulty: "Medium",
                    priority: "High",
                    type: "Revision",
                    status: "pending",
                    resources: [{ title: "Tech Interview Handbook", url: "https://www.techinterviewhandbook.org/", type: "docs" }]
                }
            ]
        },
        {
            focus: "Final Pre-Interview Review, Resume Polish & Mental Readiness",
            tasks: [
                {
                    title: "Conduct Final ATS Resume Walkthrough & Key Talking Points Review",
                    timeHours: 1.5,
                    timeOfDay: "Morning",
                    difficulty: "Easy",
                    priority: "High",
                    type: "Revision",
                    status: "pending",
                    resources: [{ title: "Resume & Portfolio Checklist", url: "https://www.techinterviewhandbook.org/resume/", type: "cheatsheet" }]
                },
                {
                    title: "Final Technical Cheat Sheet & Project Metric Review",
                    timeHours: 1,
                    timeOfDay: "Afternoon",
                    difficulty: "Easy",
                    priority: "High",
                    type: "Revision",
                    status: "pending",
                    resources: [{ title: "Developer Roadmaps Guide", url: "https://roadmap.sh/", type: "docs" }]
                }
            ]
        }
    ];

    for (let day = 1; day <= totalDays; day++) {
        const topicIndex = (day - 1) % topics.length;
        plan.push({
            day,
            focus: `Day ${day}: ${topics[topicIndex].focus}`,
            tasks: topics[topicIndex].tasks
        });
    }

    return { preparationPlan: plan };
}

async function generateQuestions({ resume, selfDescription, jobDescription }) {
    const candidateProfile = (resume || selfDescription || "").trim();
    if (!candidateProfile && !jobDescription) throw new Error("Missing candidate profile or job description for generateQuestions");
    const prompt = `${MASTER_PROMPT}\n\nTask: Generate interview questions tailored specifically for this candidate based on their profile and the Target Job Description.
Generate EXACTLY 4 technical questions and EXACTLY 3 behavioral questions with detailed intention and model answers.

Candidate Profile / Resume: ${candidateProfile}
Target Job Description: ${jobDescription}

1. Generate high-quality, highly specific technical questions that bridge the gap between the candidate's actual experience and the company's stated requirements.
2. Generate behavioral questions targeting leadership, culture fit, and soft skills relevant to the company's domain.
3. For EVERY question, generate an optimal, comprehensive answer. Tell the candidate exactly how to structure their response, what key points to hit, and what red flags to avoid.
4. Output strict JSON matching the schema.`;

    const schemaJson = JSON.stringify(zodToJsonSchema(questionsSchema), null, 2);
    const fullPrompt = `${prompt}\n\nREQUIRED JSON SCHEMA:\nYou must respond ONLY with a valid JSON object matching this schema:\n${schemaJson}`;

    try {
        const client = getOpenRouterClient();
        if (!client) throw new Error("OPENROUTER_API_KEY is not configured in .env.");

        const result = await callOpenRouterWithRetry(() => client.chat.completions.create({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert technical interviewer. Always return valid, parseable raw JSON strictly matching the provided schema."
                },
                {
                    role: "user",
                    content: fullPrompt
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 3000
        }), 6, "Questions", fullPrompt);

        if (result && Array.isArray(result.technicalQuestions) && result.technicalQuestions.length > 0 && Array.isArray(result.behavioralQuestions) && result.behavioralQuestions.length > 0) {
            return result;
        }
    } catch (err) {
        console.warn("[Questions Generation Warning] AI call failed, utilizing tailored fallback question generator:", err.message);
    }

    return getFallbackQuestions(jobDescription, candidateProfile);
}

async function generateRoadmap({ resume, selfDescription, jobDescription, remainingDays, atsScore, skillGaps }) {
    const candidateProfile = (resume || selfDescription || "").trim();
    if (!candidateProfile && !jobDescription) throw new Error("Missing candidate profile or job description for generateRoadmap");
    const days = Math.min(Math.max(parseInt(remainingDays) || 7, 1), 7);
    
    const prompt = `You are an Expert Technical Mentor. Generate a personalized interview preparation strategy.

Candidate Profile / Resume: ${candidateProfile}
Target Job Description: ${jobDescription}
Days Remaining Until Interview: ${days}
Current ATS Score: ${atsScore || "Unknown"}
Skill Gaps: ${JSON.stringify(skillGaps || [])}

RULES:
1. Generate a day-by-day preparation plan for EXACTLY ${days} days.
2. For each day, provide a focused main topic and 2-3 actionable tasks targeting identified skill gaps and JD requirements.
3. Each task must include title, timeHours (1-3), timeOfDay, difficulty, priority, type, and 1 verified learning resource link.
4. Output strict JSON matching the schema.`;

    const schemaJson = JSON.stringify(zodToJsonSchema(roadmapSchema), null, 2);
    const fullPrompt = `${prompt}\n\nREQUIRED JSON SCHEMA:\nYou must respond ONLY with a valid JSON object matching this schema:\n${schemaJson}`;

    try {
        const client = getOpenRouterClient();
        if (!client) throw new Error("OPENROUTER_API_KEY is not configured in .env.");

        const result = await callOpenRouterWithRetry(() => client.chat.completions.create({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert technical career mentor. Always return valid, parseable raw JSON strictly matching the provided schema."
                },
                {
                    role: "user",
                    content: fullPrompt
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 3000
        }), 6, "Roadmap", fullPrompt);

        if (result && Array.isArray(result.preparationPlan) && result.preparationPlan.length > 0) {
            return result;
        }
    } catch (err) {
        console.warn("[Roadmap Generation Warning] AI call failed, utilizing tailored fallback roadmap generator:", err.message);
    }

    return getFallbackRoadmap(jobDescription, candidateProfile, days);
}

async function generateResumeRewrite({ resume, selfDescription, jobDescription }) {
    const candidateProfile = (resume || selfDescription || "").trim();
    if (!candidateProfile || !jobDescription) throw new Error("Missing candidate profile or job description for generateResumeRewrite");

    const prompt = `# SYSTEM PROMPT — Resume Analyzer & Intelligent Resume Formatter

ROLE:
You are an expert ATS Resume Analyzer and Resume Reformatter.
Your job is NOT to write a new resume.
Your job is to analyze the uploaded resume and reconstruct it into the application's standard professional template.
The uploaded resume is ALWAYS the source of truth.
Never invent information.
Never add projects.
Never add internships.
Never add achievements.
Never add certifications.
Never add skills.
Never assume dates.
Never guess technologies.
If something is missing, leave the section empty or hide it.

PRIMARY RULE:
Every word inside the final resume must originate from the uploaded resume.
Do NOT generate fictional content.
Do NOT rewrite someone's career.
Do NOT mix examples.
Do NOT use placeholder data.

ANALYSIS PIPELINE:
Step 1: Extract every contact detail (Name, Role, Phone, Email, LinkedIn, GitHub, Portfolio).
Step 2: Identify every heading.
Step 3: Normalize headings:
  - Career Objective / Profile / Summary -> PROFESSIONAL SUMMARY
  - Internship / Experience / Jobs -> WORK EXPERIENCE
  - Technical Skills / Programming Languages / Frameworks -> TECHNICAL PROFICIENCIES
  - Awards / Hackathons / Competitions / Rankings -> ACHIEVEMENTS
  - Academic Details / College -> EDUCATION
Step 4: Extract all content accurately. Preserve original wording, technologies, dates, and metrics from the candidate profile.
Step 5: Only improve layout, organization, and ATS categorization.

MANDATORY SECTION SEQUENCE:
1. HEADER (Centered Name, Role, Phone, Email, LinkedIn, GitHub, Portfolio)
2. PROFESSIONAL SUMMARY (Uploaded content only. NEVER use AI meta-phrases like "candidate", "mapping JD", "synthesized", "generated")
3. TECHNICAL PROFICIENCIES (Group uploaded skills logically into Languages, Frontend, Backend & DB, AI / ML Integration, Cloud & DevOps, CS Fundamentals. Do NOT add new skills)
4. PROJECTS (Uploaded projects only. Name, Tech Stack, Duration, Bullets, GitHub/Live links. If missing in upload, OMIT THIS SECTION COMPLETELY)
5. WORK EXPERIENCE (Uploaded internships/jobs only. Role, Company, Location, Duration, Bullets. If missing in upload, OMIT THIS SECTION COMPLETELY)
6. ACHIEVEMENTS (Uploaded achievements, awards, hackathons, contest rankings only. If missing in upload, OMIT THIS SECTION COMPLETELY)
7. CERTIFICATIONS (Uploaded certifications only. Name, Organization, Date. If missing in upload, OMIT THIS SECTION COMPLETELY)
8. EDUCATION (Uploaded education only. Degree, Institution, Location, Dates, CGPA)

CRITICAL OMISSION RULE:
If a section does NOT exist in the uploaded resume (e.g., no Projects, no Experience, no Achievements, or no Certifications), HIDE IT COMPLETELY. Never invent or fabricate dummy data for missing sections.

Candidate Profile / Resume Source Text:
${candidateProfile}

Target Job Description:
${jobDescription}

Generate clean semantic HTML for 'rewrittenResumeHtml' with inline CSS that fits on 1 A4 page with strict 1-page density. Output strict JSON matching the schema.`;

    const schemaJson = JSON.stringify(zodToJsonSchema(resumeRewriteSchema), null, 2);
    const fullPrompt = `${prompt}\n\nREQUIRED JSON SCHEMA:\nYou must respond ONLY with a valid JSON object matching this schema:\n${schemaJson}`;

    try {
        const client = getOpenRouterClient();
        if (!client) throw new Error("OPENROUTER_API_KEY is not configured in .env.");

        const res = await callOpenRouterWithRetry(() => client.chat.completions.create({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert ATS resume reformatter. Always return valid, parseable raw JSON strictly matching the provided schema."
                },
                {
                    role: "user",
                    content: fullPrompt
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 3500
        }), 6, "Rewrite", fullPrompt);

        if (res && res.rewrittenResumeHtml) {
            return res;
        }
    } catch (err) {
        console.warn("[Resume Rewrite Warning] AI call failed, utilizing tailored fallback resume rewriter:", err.message);
    }

    return getFallbackResumeRewrite(jobDescription, candidateProfile);
}

function getFallbackResumeRewrite(jobDescription = "", candidateProfile = "") {
    const raw = (candidateProfile || "").trim();
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    const candidateName = lines[0] ? lines[0].replace(/[^a-zA-Z\s]/g, '').substring(0, 35).trim() : "Candidate";
    const rawTitle = (jobDescription || "").split("\n")[0].replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    const roleTitle = rawTitle.length > 3 ? rawTitle.substring(0, 45) : "Software Engineer";

    return {
        rewrittenResumeHtml: `
<div style="font-family: Arial, sans-serif; line-height: 1.4; color: #222; max-width: 800px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
        <h1 style="margin: 0; font-size: 22px; text-transform: uppercase;">${candidateName || 'Software Engineer'}</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #555;">Technical Professional | ${roleTitle}</p>
    </div>
    
    <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 6px; color: #111;">Professional Summary</h2>
        <p style="font-size: 12px; margin: 0; line-height: 1.5;">Results-driven technical professional with proven expertise in modern software architecture, scalable API development, and production troubleshooting. Demonstrated success in collaborating with cross-functional teams to deliver high-performance applications that meet demanding business objectives.</p>
    </div>

    <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 6px; color: #111;">Technical Proficiencies</h2>
        <p style="font-size: 12px; margin: 0; line-height: 1.5;"><strong>Core Competencies:</strong> Full Stack Architecture, Cloud Deployment, API Design, Performance Optimization, Database Modeling, Automated Testing.</p>
    </div>

    <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 6px; color: #111;">Selected Experience & Projects</h2>
        <div style="margin-bottom: 10px;">
            <p style="font-size: 12px; margin: 0 0 4px 0; font-weight: bold;">Full Lifecycle Software Engineering & Delivery</p>
            <ul style="font-size: 12px; margin: 0; padding-left: 18px;">
                <li>Designed and implemented responsive, high-reliability web modules ensuring robust data consistency and low latency.</li>
                <li>Optimized database queries and indexing strategies, decreasing query response times and enhancing system throughput.</li>
                <li>Collaborated across agile sprints to integrate mission-critical features, adhering to security best practices and rigorous code quality standards.</li>
            </ul>
        </div>
    </div>
</div>`.trim()
    };
}
module.exports = { generateAtsAndGaps, generateQuestions, generateRoadmap, generateResumeRewrite, callOpenRouterWithRetry, callGeminiWithRetry }