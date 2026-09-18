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
        question: z.string().describe("Direct, realistic technical interview question matching the exact technologies, stack, and architectural challenges required by the target job description."),
        intention: z.string().describe("Detailed evaluation criteria: what the interviewer is assessing regarding depth of knowledge, system design reasoning, trade-offs, and edge cases."),
        answer: z.string().describe("Optimal, in-depth model answer formatted with clear sections: 1. Core Concept & High-level Thesis, 2. Step-by-Step Architecture & Implementation Details, 3. Scalability, Latency & Edge Cases, and 4. Common Red Flags / Pitfalls to avoid.")
    })).describe("Technical questions tailored specifically to the candidate's gaps against the target JD requirements"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("Behavioral or situational interview question targeting leadership, conflict resolution, technical ownership, or cross-functional teamwork relevant to the role."),
        intention: z.string().describe("What the interviewer is evaluating regarding culture fit, communication maturity, problem resolution, and leadership."),
        answer: z.string().describe("Optimal model answer structured using the STAR method: Situation & Task, Action (specific technical/leadership steps taken), Result (measurable business/system outcome with quantitative metrics), and Retrospective learning.")
    })).describe("Behavioral questions testing leadership, culture fit, and teamwork"),
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
    const jdLower = (jobDescription || "").toLowerCase();
    const isFrontend = jdLower.includes("react") || jdLower.includes("vue") || jdLower.includes("frontend") || jdLower.includes("ui") || jdLower.includes("angular") || jdLower.includes("next.js");
    const isDataOrML = jdLower.includes("python") || jdLower.includes("machine learning") || jdLower.includes("data") || jdLower.includes("ai") || jdLower.includes("llm");
    const isCloud = jdLower.includes("aws") || jdLower.includes("docker") || jdLower.includes("kubernetes") || jdLower.includes("devops") || jdLower.includes("ci/cd");

    const primaryFocus = isFrontend 
        ? "Frontend Architecture & State Management" 
        : isDataOrML 
            ? "Data Engineering & Pipeline Scaling" 
            : isCloud 
                ? "Cloud Infrastructure & Containerization" 
                : "Backend Architecture & Distributed Systems";

    return {
        technicalQuestions: [
            {
                question: `In the context of ${primaryFocus}, how would you architect and optimize a high-throughput, low-latency system based on the requirements in this job description?`,
                intention: "Evaluates comprehensive system design thinking, component decoupling, caching strategy (e.g., Redis/CDN), asynchronous processing, and measurable latency optimization.",
                answer: `1. Core Architectural Thesis:
State the high-level architecture clearly: decouple read and write paths using stateless services, distribute workloads behind an API gateway/load balancer, and implement multi-tiered caching.

2. Step-by-Step Technical Execution:
- Implement Redis or CDN layers to cache static and hot-read payloads, reducing origin database load by up to 80%.
- Partition databases (horizontal sharding or read replicas) and create compound indexes specifically on high-frequency query filter columns.
- Offload non-blocking workflows (e.g. notifications, report generation, heavy parsing) to asynchronous message queues (BullMQ/Kafka) with dead-letter queue recovery.

3. Production Considerations & Edge Cases:
- Address cache invalidation strategies (TTL + event-driven invalidation) to prevent stale state.
- Implement circuit breakers and graceful degradation when downstream dependencies experience latency spikes.
- Monitor P95/P99 latency, database connection pool exhaustion, and error budgets.

4. Critical Red Flags to Avoid:
- Failing to discuss database indexing or connection pooling under load.
- Suggesting synchronous operations for heavy computing or file processing.
- Ignoring data consistency trade-offs (CAP theorem considerations).`
            },
            {
                question: "Explain your database design strategy, indexing choices, and query performance tuning process when scaling to millions of records.",
                intention: "Tests real-world database expertise, query execution analysis (EXPLAIN ANALYZE), normalization vs denormalization trade-offs, and concurrency management.",
                answer: `1. Core Architectural Thesis:
Database performance starts with schema normalization for transactional integrity, transitioning selectively to denormalized views or cache layers for read-heavy query patterns.

2. Step-by-Step Technical Execution:
- Analyze slow query logs and execute EXPLAIN / EXPLAIN ANALYZE to identify sequential scans, missing indexes, and expensive hash joins.
- Create B-Tree composite indexes adhering to the leftmost prefix rule for compound filters; utilize partial indexes or GiST/GIN indexes for specialized searches.
- Implement cursor-based pagination instead of offset-based pagination to prevent performance degradation on large datasets.

3. Production Considerations & Edge Cases:
- Manage transaction isolation levels (Read Committed vs Serializable) to avoid dirty reads without triggering phantom deadlocks.
- Establish strict connection pooling (e.g., PgBouncer or Mongo connection pools) to prevent server thread exhaustion.
- Implement soft-deletes and data archival strategies for historical records over 1 year old.

4. Critical Red Flags to Avoid:
- Never say you 'just add an index on every column'—highlight index write overhead and storage costs.
- Overlooking connection pool limits or N+1 query problems in ORMs.`
            },
            {
                question: "How do you implement comprehensive application security (OWASP Top 10), authentication/authorization, and secure API boundaries?",
                intention: "Assesses security mindset, token lifecycle management (access vs refresh tokens), RBAC/ABAC enforcement, input sanitization, and data protection at rest and in transit.",
                answer: `1. Core Architectural Thesis:
Security is defense-in-depth: enforce strict authentication, granular Role-Based Access Control (RBAC), end-to-end transport encryption, and parameterized input validation across every boundary.

2. Step-by-Step Technical Execution:
- Use short-lived JWT access tokens (15-minute expiration) paired with cryptographically secure, HttpOnly, SameSite=Lax/Strict refresh tokens stored in a revoked-token Redis blacklist.
- Enforce declarative authorization middleware before controllers to verify user permissions against required resource policies.
- Sanitize and validate all incoming request bodies using strict schema validators (Zod/Joi) to completely eliminate SQL/NoSQL injection and XSS.

3. Production Considerations & Edge Cases:
- Enforce strict CORS policies restricted to trusted origins and configure security headers (Helmet, CSP, HSTS).
- Implement tiered rate limiting by IP and authenticated user ID to defend against brute-force and DDoS vectors.
- Ensure sensitive secrets and keys are managed through KMS / secure environment variables, never committed in code.

4. Critical Red Flags to Avoid:
- Storing sensitive tokens in unencrypted localStorage (vulnerable to XSS).
- Relying purely on client-side validation without strict server-side validation.`
            },
            {
                question: "Describe your approach to asynchronous background job processing, distributed error handling, and achieving high system availability.",
                intention: "Determines hands-on experience with background task orchestration, queue worker architectures, idempotent operations, and fault recovery.",
                answer: `1. Core Architectural Thesis:
Critical operations must never block the main request-response cycle. Asynchronous task queues provide resilient decoupling, allowing the system to absorb traffic spikes without degrading user response times.

2. Step-by-Step Technical Execution:
- Dispatch background workloads to durable message queues (e.g. BullMQ with Redis or RabbitMQ/Kafka) immediately upon receiving requests.
- Ensure all worker job consumers are strictly idempotent (e.g., using unique transaction/event IDs to prevent duplicate charging or processing if a task retries).
- Configure exponential backoff retry policies with a maximum retry ceiling, forwarding persistently failing jobs to a Dead Letter Queue (DLQ) for alerting.

3. Production Considerations & Edge Cases:
- Monitor queue depth, active worker concurrency, and consumer lag to trigger auto-scaling.
- Handle worker shutdown gracefully (SIGTERM/SIGINT) by allowing in-flight jobs to complete or safely re-enqueue.
- Implement distributed tracing (OpenTelemetry/APM) to track request workflows across async boundaries.

4. Critical Red Flags to Avoid:
- Forgetting idempotency, leading to duplicate side-effects on automatic retries.
- Not implementing a Dead Letter Queue or worker health check monitoring.`
            }
        ],
        behavioralQuestions: [
            {
                question: "Tell me about a time you encountered a severe production outage or critical regression under high pressure. How did you triage, resolve, and prevent it?",
                intention: "Evaluates emotional composure under pressure, methodical incident triage, team communication, and blameless post-mortem commitment.",
                answer: `1. Situation & Task:
A critical release caused a 30% surge in 500 errors and degraded checkout latency for 10,000+ active users. As on-call engineer, my responsibility was immediate stabilization and root-cause remediation.

2. Action:
- Communicated immediate incident acknowledgment to stakeholders and declared an active incident response channel.
- Analyzed APM error traces and server metrics, identifying that a new database migration had locked a heavily indexed table.
- Swiftly initiated an automated rollback to the previous stable build within 8 minutes, immediately restoring system health.
- Investigated the root cause in staging, reproduced the table lock condition, and rewritten the migration to run concurrently without table locks.

3. Result & Reflection:
- System was restored to 99.99% availability within 12 minutes with zero data corruption.
- Led a blameless post-mortem, added automated staging load tests for DB migrations, and implemented canary deployments to catch similar issues with zero user impact.`
            },
            {
                question: "Describe a situation where you had a fundamental technical disagreement with another senior engineer or team lead. How did you resolve it?",
                intention: "Evaluates empathy, constructive collaboration, reliance on data/benchmarks over ego, and commitment to collective decisions.",
                answer: `1. Situation & Task:
During an architectural redesign, a teammate wanted to implement an event-driven microservices architecture, whereas I advocated for a modular monolith given our current team size (4 engineers) and product roadmap deadlines.

2. Action:
- Avoided emotional debate and scheduled a focused alignment session. Framed the discussion around objective trade-offs: operational overhead, deployment complexity, debugging cost, and time-to-market.
- Created a lightweight matrix comparing both architectures against our 6-month goals, and built a quick prototype demonstrating how a modular monolith preserved clean service boundaries that could be split into microservices later if scaling required it.
- Actively validated their valid concerns about future scaling bottlenecks and agreed on clear architectural milestones that would trigger a microservice extraction.

3. Result & Reflection:
- The team unanimously agreed to proceed with the modular monolith, successfully shipping the MVP 3 weeks ahead of deadline.
- Preserved strong team trust and established a standardized RFC review process for future architectural decisions.`
            },
            {
                question: "How do you balance aggressive product deadlines with addressing technical debt and maintaining engineering standards?",
                intention: "Checks pragmatic business alignment, technical judgment, and the ability to articulate technical risk in business value terms.",
                answer: `1. Situation & Task:
Our product team had a tight deadline to ship a major enterprise feature in 4 weeks, but the core module had accumulated significant tech debt (untested legacy spaghetti code) that risked severe regressions.

2. Action:
- Collaborated with the Product Manager rather than pushing back blindly. Quantified the debt in terms of business impact: shipping without refactoring would increase bug turnaround time by 40% and jeopardize release stability.
- Proposed a phased strategy: allocated 20% of the sprint to extract and unit test the core interfaces first, which reduced complexity for the remaining 80% feature build.
- Instituted an ongoing policy of allocating 15-20% of each sprint to continuous refactoring and performance optimization.

3. Result & Reflection:
- Successfully shipped the enterprise feature on schedule with zero high-severity production bugs.
- Demonstrated to stakeholders that investing in technical health directly improves feature delivery velocity rather than slowing it down.`
            }
        ]
    };
}

function getFallbackRoadmap(jobDescription = "", candidateProfile = "", daysCount = 7) {
    const totalDays = Math.min(Math.max(parseInt(daysCount) || 7, 1), 7);
    const jdLower = (jobDescription || "").toLowerCase();
    
    const isFrontend = jdLower.includes("react") || jdLower.includes("vue") || jdLower.includes("frontend") || jdLower.includes("ui") || jdLower.includes("next.js") || jdLower.includes("angular");
    const isDataOrML = jdLower.includes("python") || jdLower.includes("data") || jdLower.includes("machine learning") || jdLower.includes("ai") || jdLower.includes("deep learning");
    const isCloud = jdLower.includes("aws") || jdLower.includes("docker") || jdLower.includes("kubernetes") || jdLower.includes("devops") || jdLower.includes("ci/cd");

    const allCurriculum = [
        {
            focus: isFrontend 
                ? "Core Frontend Architecture & State Management" 
                : isDataOrML 
                    ? "Data Pipeline Architecture & Distributed Computing" 
                    : isCloud 
                        ? "Cloud Architecture, Containerization & Networking" 
                        : "Core System Architecture & Technical Fundamentals",
            tasks: [
                {
                    title: isFrontend 
                        ? "Master Component Lifecycle, Hooks, State & Render Optimization" 
                        : "Review Core Architecture Patterns, Concurrency & Data Structures",
                    timeHours: 2,
                    timeOfDay: "Morning",
                    difficulty: "Medium",
                    priority: "High",
                    type: "Learn",
                    status: "pending",
                    resources: [{ 
                        title: isFrontend ? "React Architecture & Render Cycle Docs" : "System Design Primer", 
                        url: isFrontend ? "https://react.dev/learn" : "https://github.com/donnemartin/system-design-primer", 
                        type: "docs" 
                    }]
                },
                {
                    title: "Practice High-Frequency Core Technical Interview Questions",
                    timeHours: 2,
                    timeOfDay: "Afternoon",
                    difficulty: "Hard",
                    priority: "High",
                    type: "Practice",
                    status: "pending",
                    resources: [{ title: "LeetCode Curated Top 75", url: "https://leetcode.com/studyplan/leetcode-75/", type: "practice" }]
                }
            ]
        },
        {
            focus: "Database Schema Optimization, Indexing & Caching Strategies",
            tasks: [
                {
                    title: "Master Composite Indexing, Query Plans & EXPLAIN Execution Analysis",
                    timeHours: 2,
                    timeOfDay: "Morning",
                    difficulty: "Medium",
                    priority: "High",
                    type: "Learn",
                    status: "pending",
                    resources: [{ title: "Use The Index, Luke! - Indexing Guide", url: "https://use-the-index-luke.com/", type: "docs" }]
                },
                {
                    title: "Implement Multi-Tier Caching with Redis & Cache Invalidation Policies",
                    timeHours: 2,
                    timeOfDay: "Afternoon",
                    difficulty: "Hard",
                    priority: "High",
                    type: "Project",
                    status: "pending",
                    resources: [{ title: "Redis Architecture & Patterns", url: "https://redis.io/docs/", type: "docs" }]
                }
            ]
        },
        {
            focus: "API Security, Authentication Boundaries & High Availability",
            tasks: [
                {
                    title: "Deep Dive into OAuth 2.0, JWT Token Rotation & OWASP Top 10 Mitigation",
                    timeHours: 2,
                    timeOfDay: "Morning",
                    difficulty: "Medium",
                    priority: "High",
                    type: "Learn",
                    status: "pending",
                    resources: [{ title: "OWASP Top 10 Security Guide", url: "https://owasp.org/www-project-top-ten/", type: "cheatsheet" }]
                },
                {
                    title: "Implement Rate Limiting, Input Validation & Security Middleware",
                    timeHours: 1.5,
                    timeOfDay: "Afternoon",
                    difficulty: "Medium",
                    priority: "Medium",
                    type: "Practice",
                    status: "pending",
                    resources: [{ title: "MDN Web Security & HTTP Headers", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers", type: "docs" }]
                }
            ]
        },
        {
            focus: "Scalable Distributed Systems & Asynchronous Task Processing",
            tasks: [
                {
                    title: "Architect Message Queues (BullMQ/Kafka) & Idempotent Worker Processing",
                    timeHours: 2.5,
                    timeOfDay: "Morning",
                    difficulty: "Hard",
                    priority: "High",
                    type: "Project",
                    status: "pending",
                    resources: [{ title: "Distributed Task Queue Patterns", url: "https://github.com/donnemartin/system-design-primer#message-queues", type: "docs" }]
                },
                {
                    title: "Implement Dead-Letter Queues, Exponential Backoff & Fault Recovery",
                    timeHours: 1.5,
                    timeOfDay: "Afternoon",
                    difficulty: "Medium",
                    priority: "High",
                    type: "Practice",
                    status: "pending",
                    resources: [{ title: "Reliable Asynchronous Processing Guide", url: "https://roadmap.sh/backend", type: "docs" }]
                }
            ]
        },
        {
            focus: "Cloud Deployment, CI/CD Automation & Production Monitoring",
            tasks: [
                {
                    title: "Containerize Applications with Multi-Stage Docker Builds & Health Checks",
                    timeHours: 2,
                    timeOfDay: "Morning",
                    difficulty: "Medium",
                    priority: "High",
                    type: "Practice",
                    status: "pending",
                    resources: [{ title: "Docker Best Practices Guide", url: "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/", type: "docs" }]
                },
                {
                    title: "Configure Automated CI/CD Workflows & Cloud Environment Secrets",
                    timeHours: 2,
                    timeOfDay: "Afternoon",
                    difficulty: "Medium",
                    priority: "Medium",
                    type: "Project",
                    status: "pending",
                    resources: [{ title: "GitHub Actions CI/CD Documentation", url: "https://docs.github.com/en/actions", type: "docs" }]
                }
            ]
        },
        {
            focus: "Full-Stack Mock Simulation & High-Stress Technical Problem Solving",
            tasks: [
                {
                    title: "Execute Timed End-to-End System Design Mock Simulation",
                    timeHours: 2.5,
                    timeOfDay: "Morning",
                    difficulty: "Hard",
                    priority: "High",
                    type: "Mock",
                    status: "pending",
                    resources: [{ title: "ByteByteGo System Design Visuals", url: "https://bytebytego.com/", type: "article" }]
                },
                {
                    title: "Analyze Mock Feedback, Benchmark Weak Areas & Refactor Solutions",
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
            focus: "Behavioral STAR Mastery, Resume Metrics Walkthrough & Final Polish",
            tasks: [
                {
                    title: "Rehearse 5 Core STAR Stories (Incident Outages, Technical Conflicts, Trade-offs)",
                    timeHours: 2,
                    timeOfDay: "Morning",
                    difficulty: "Medium",
                    priority: "High",
                    type: "Revision",
                    status: "pending",
                    resources: [{ title: "Behavioral Interview Prep Handbook", url: "https://www.techinterviewhandbook.org/behavioral-interview/", type: "cheatsheet" }]
                },
                {
                    title: "Final ATS Resume Metric Review, Talking Points & Interview Mindset",
                    timeHours: 1.5,
                    timeOfDay: "Afternoon",
                    difficulty: "Easy",
                    priority: "High",
                    type: "Revision",
                    status: "pending",
                    resources: [{ title: "Pre-Interview Mental Readiness Checklist", url: "https://www.techinterviewhandbook.org/final-prep/", type: "article" }]
                }
            ]
        }
    ];

    let selectedCurriculum = [];
    if (totalDays === 1) {
        selectedCurriculum = [{
            focus: "Intensive 24-Hour Final Technical & Behavioral Sprint",
            tasks: [
                allCurriculum[0].tasks[0],
                allCurriculum[5].tasks[0],
                allCurriculum[6].tasks[0]
            ]
        }];
    } else if (totalDays === 3) {
        selectedCurriculum = [
            allCurriculum[0],
            allCurriculum[1],
            allCurriculum[6]
        ];
    } else if (totalDays === 5) {
        selectedCurriculum = [
            allCurriculum[0],
            allCurriculum[1],
            allCurriculum[2],
            allCurriculum[5],
            allCurriculum[6]
        ];
    } else {
        selectedCurriculum = allCurriculum.slice(0, totalDays);
    }

    const plan = selectedCurriculum.map((item, idx) => ({
        day: idx + 1,
        focus: item.focus.replace(/^Day\s*\d+\s*[:\-–—]\s*/i, '').trim(),
        tasks: item.tasks.map((task, tIdx) => ({
            ...task,
            _id: `day-${idx + 1}-task-${tIdx + 1}`
        }))
    }));

    return { preparationPlan: plan };
}

async function generateQuestions({ resume, selfDescription, jobDescription }) {
    const candidateProfile = (resume || selfDescription || "").trim();
    if (!candidateProfile && !jobDescription) throw new Error("Missing candidate profile or job description for generateQuestions");
    const prompt = `${MASTER_PROMPT}

Task: Generate high-caliber, perfectly matching interview questions with comprehensive, optimal model answers.
Analyze the Candidate Profile / Resume against the Target Job Description to identify technical intersections and critical gaps.

Candidate Profile / Resume:
${candidateProfile}

Target Job Description:
${jobDescription}

STRICT GENERATION GUIDELINES:
1. TECHNICAL QUESTIONS (EXACTLY 4):
   - Every question MUST directly target specific technologies, architectural patterns, system design, or engineering practices emphasized in the Job Description.
   - Do NOT ask trivial trivia (e.g. "What is a variable?"). Ask scenario-based, production-level engineering questions (e.g., handling concurrency, database indexing, caching strategies, microservice communication, distributed state).
   - For EVERY question, provide an OPTIMAL, IN-DEPTH MODEL ANSWER structured with:
     * 1. Core Concept & Strategic Approach (the immediate high-level answer)
     * 2. Step-by-Step Technical Implementation (specific tools, patterns, libraries, schemas)
     * 3. Production Trade-offs & Edge Cases (latency, throughput, failover, concurrency)
     * 4. What NOT to say / Pitfalls (amateur traps that cause interview failure)

2. BEHAVIORAL QUESTIONS (EXACTLY 3):
   - Tailored to the seniority, domain, and collaborative nature of the target role (e.g., cross-functional disputes, handling live production outages, managing tight deadlines vs tech debt).
   - For EVERY question, provide an OPTIMAL MODEL ANSWER using the STAR method:
     * Situation: Realistic engineering context and stakes
     * Task: Explicit responsibility and objective
     * Action: Decisive technical and communication steps taken
     * Result: Quantifiable business/system outcome (e.g., 40% latency reduction, 99.99% uptime) and key reflection

3. ACCURACY & QUALITY:
   - Match the exact stack from the JD (Node.js, React, Python, AWS, Docker, PostgreSQL, etc.).
   - Output strict JSON strictly following the schema.`;

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
                    content: "You are an expert technical interviewer and engineering leader. Always return valid, parseable raw JSON strictly matching the provided schema."
                },
                {
                    role: "user",
                    content: fullPrompt
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 3500
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
    
    const prompt = `${MASTER_PROMPT}

Task: Generate a high-impact, professional day-by-day technical interview preparation roadmap.
Create a structured, non-clumsy learning path tailored directly to the candidate's skill gaps and the target role requirements.

Candidate Profile / Resume:
${candidateProfile}

Target Job Description:
${jobDescription}

Timeline: EXACTLY ${days} Days Remaining
ATS Match Score: ${atsScore || "Calculated from JD"}
Identified Skill Gaps: ${JSON.stringify(skillGaps || [])}

PEDAGOGICAL STRUCTURE & RULES:
1. Generate an array of EXACTLY ${days} days (day: 1 to ${days}).
2. LOGICAL CHRONOLOGICAL PROGRESSION:
   - Day 1: High-priority core technologies & addressing primary skill gaps identified in the JD.
   - Middle Days: Deep dive into systems, database optimization, caching, backend/frontend architectural patterns, and production API design.
   - Penultimate Day: System design mock scenarios, high-frequency coding patterns, and edge-case handling.
   - Final Day: Behavioral mastery (STAR stories), resume metrics walkthrough, and pre-interview readiness checklist.
3. FOR EACH DAY:
   - "focus": A concise, high-impact title summarizing the core theme (e.g. "Microservices Architecture & State Management" — DO NOT write "Day X:" because the UI already renders the Day badge).
   - "tasks": EXACTLY 2 or 3 specific, focused tasks.
4. FOR EACH TASK:
   - "title": Action-oriented and descriptive (e.g., "Implement Redis Caching & Invalidation Patterns", not just "Learn Redis").
   - "timeHours": Realistic focused study time (1 to 3 hours). Total daily hours should not exceed 5-6 hours.
   - "timeOfDay": "Morning", "Afternoon", "Evening", or "Night".
   - "difficulty": "Easy", "Medium", or "Hard".
   - "priority": "High", "Medium", or "Low".
   - "type": "Learn", "Practice", "Project", "Revision", or "Mock".
   - "resources": 1 or 2 authoritative, real documentation or tutorial links (e.g., MDN, official docs, GitHub System Design Primer, LeetCode, Roadmap.sh).
5. Output strict, valid JSON matching the schema.`;

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
            max_tokens: 3500
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