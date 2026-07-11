const { GoogleGenAI } = require("@google/genai")
const { GEMINI_MODEL } = require('../config/ai.config');
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")


if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.error("CRITICAL ERROR: GOOGLE_GENAI_API_KEY is not set in the environment variables.");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

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
const geminiCache = new Map();

async function callGeminiWithRetry(apiCall, maxRetries = 8, stageLabel = "AI", prompt = "") {
    const promptHash = prompt ? crypto.createHash('sha256').update(prompt).digest('hex') : null;
    if (promptHash && geminiCache.has(promptHash)) {
        console.log(`[OK] Cache hit for Gemini API [${stageLabel}]`);
        return geminiCache.get(promptHash);
    }

    let retries = 0;
    while (true) {
        let shouldRetry = false;
        let delay = 0;
        let finalError = null;
        let result = null;

        const currentAttempt = retries + 1;
        console.log(`[START] Gemini Request [${stageLabel}] (Attempt ${currentAttempt}/${maxRetries + 1})`);
        const timerId = setInterval(() => {
            console.log(`STAGE TIME: Gemini API request [${stageLabel}] is taking more than 5 seconds...`);
        }, 5000);

        console.time(`${stageLabel} Request Time (Attempt ${currentAttempt})`);
        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("AI Request Timed Out (60s)")), 60000));
            
            console.log(`[OK] Initiating Promise.race between Gemini API call [${stageLabel}] and 60s timeout`);
            const apiPromise = apiCall();
            const response = await Promise.race([apiPromise, timeoutPromise]);
            console.log(`[OK] Gemini Response Received [${stageLabel}]`);
            
            const text = response.text;
            if (!text) throw new Error("Empty response from AI");
            
            console.log(`[OK] JSON Parsed [${stageLabel}]`);
            result = parseAndCleanJson(text);
        } catch (error) {
            logCompleteError("ai.service", `callGeminiWithRetry:${stageLabel}`, error);
            const message = error.message || "";
            const isServiceUnavailable = error.status === 503 || (error.response && error.response.status === 503) || message.includes("503") || message.toLowerCase().includes("unavailable") || message.toLowerCase().includes("high demand") || message.includes("Timed Out");
            const isZeroLimit = message.toLowerCase().includes("limit: 0") || message.toLowerCase().includes("limit = 0");
            const isRateLimit = (error.status === 429 || message.includes("429")) && !isZeroLimit;
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
                console.warn(`[Gemini API] Retrying ${retries}/${maxRetries} in ${delay}ms. Reason: ${message.split('\n')[0]}`);
            } else {
                finalError = error;
            }
        } finally {
            clearInterval(timerId);
            console.timeEnd(`${stageLabel} Request Time (Attempt ${currentAttempt})`);
        }

        if (finalError) throw finalError;
        if (result !== null) {
            console.log(`[SUCCESS] Gemini request [${stageLabel}] complete and parsed successfully`);
            if (promptHash) geminiCache.set(promptHash, result);
            return result;
        }
        
        if (shouldRetry) {
            await sleep(delay);
        }
    }
}

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

async function generateAtsAndGaps({ resume, jobDescription }) {
    console.log(`[2] Starting ATS Analysis: resumeLength=${resume ? resume.length : 0}, jobDescriptionLength=${jobDescription ? jobDescription.length : 0}`);
    if (!resume || !jobDescription) throw new Error("Missing resume or jobDescription for generateAtsAndGaps");
    const prompt = `${MASTER_PROMPT}\n\nTask: Analyze the candidate's resume against the Target Job Description to calculate the ATS Score, Match Score, identify Skill Gaps, and provide Recruiter Feedback.
CRITICAL FOR SPEED: Limit the Skill Gaps array to a MAXIMUM of 4 gaps. Keep feedback very concise.

Original Resume: ${resume}
Target Job Description: ${jobDescription}

Perform a rigorous JOB DESCRIPTION ANALYSIS and RESUME ANALYSIS.
1. Extract ALL required and preferred skills, tools, and terminology from the Job Description.
2. Identify weak bullet points, outdated tech, and redundant skills in the original resume.
3. Calculate an ATS score and identify Missing Keywords.
4. IMPORTANT: Identify EXACT missing keywords that, if added naturally to the resume, would bring the ATS score to 95+. Do NOT recommend generic terms. Provide specific technical keywords, methodologies, or tools mentioned in the JD that are absent from the resume.
5. Output strict JSON matching the schema.`;

    const res = await callGeminiWithRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(atsGapsSchema),
        }
    }), 8, "ATS");
    console.log("[5] ATS parsed successfully");
    return res;
}

async function generateQuestions({ resume, jobDescription }) {
    if (!resume || !jobDescription) throw new Error("Missing resume or jobDescription for generateQuestions");
    const prompt = `${MASTER_PROMPT}\n\nTask: Generate interview questions tailored specifically for this candidate based on their resume and the Target Job Description.
CRITICAL FOR SPEED: Generate EXACTLY 3 technical questions and EXACTLY 2 behavioral questions. Keep the answers extremely concise.

Original Resume: ${resume}
Target Job Description: ${jobDescription}

1. Generate high-quality, highly specific technical questions that bridge the gap between the candidate's actual experience and the company's stated requirements.
2. Generate behavioral questions targeting leadership, culture fit, and soft skills relevant to the company's domain.
3. For EVERY question, generate an optimal, comprehensive answer. Tell the candidate exactly how to structure their response, what key points to hit, and what red flags to avoid.
4. Output strict JSON matching the schema.`;

    return await callGeminiWithRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(questionsSchema),
        }
    }), 8, "Questions");
}

async function generateRoadmap({ resume, jobDescription, remainingDays, atsScore, skillGaps }) {
    if (!resume || !jobDescription) throw new Error("Missing resume or jobDescription for generateRoadmap");
    const prompt = `You are an Expert Technical Mentor. Generate a personalized interview preparation strategy.

Original Resume: ${resume}
Target Job Description: ${jobDescription}
Days Remaining Until Interview: ${remainingDays || 7}
Current ATS Score: ${atsScore || "Unknown"}
Skill Gaps: ${JSON.stringify(skillGaps || [])}

CRITICAL RULES FOR SPEED AND ACCURACY:
1. STRICT LIMIT: Generate a MAXIMUM of 3 days. Focus ONLY on the absolute most critical skill gaps.
2. CONCISENESS: Keep descriptions extremely short and punchy. Limit to 2 tasks per day.
3. RESOURCES: Provide EXACTLY 1 resource per task to save generation time. Do not invent URLs; use known documentation URLs.
4. Output strict JSON matching the schema.`;

    return await callGeminiWithRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(roadmapSchema),
        }
    }), 8, "Roadmap");
}

async function generateResumeRewrite({ resume, selfDescription, jobDescription }) {
    if (!resume || !jobDescription) throw new Error("Missing resume or jobDescription for generateResumeRewrite");
    const prompt = `${MASTER_PROMPT}\n\nTask: Completely rewrite the candidate's resume to maximize ATS compatibility (Target: 95+) for the specific Job Description, while strictly adhering to a ONE PAGE limit.

Original Resume: ${resume}
Candidate's Self Description: ${selfDescription || ""}
Target Job Description: ${jobDescription}

For the 'rewrittenResumeHtml' field, follow these STRICT RULES:
1. ONE PAGE REQUIREMENT (MANDATORY):
- The generated HTML MUST cleanly fit on a single A4 page when rendered to PDF.
- Aggressively compress information. Merge similar skills. Shorten verbose bullet points.
- Omit outdated roles or projects if the candidate has too much experience. Prioritize relevance over completeness.
- Only allow a second page if the candidate has 10+ years of CRUCIAL experience that cannot be removed.

2. ATS & CONTENT OPTIMIZATION:
- Target an ATS Score of 95+. Naturally inject keywords from the Job Description. DO NOT keyword stuff.
- Prioritize Contact Info, Prof Summary, Tech Skills, Experience, Projects, Education.
- REORDER skills so that Job Description matching skills appear first.
- Rewrite bullets into concise, achievement-focused statements with measurable outcomes and powerful action verbs.
- NEVER fabricate experience, companies, projects, or metrics.

3. HTML/CSS STYLING:
- Use standard readable fonts (Arial, Helvetica, sans-serif).
- Use a single-column, highly compact layout.
- Use tight margins and line-heights (e.g., line-height: 1.2, small margins).
- Keep the design simple, ATS-parsable, with NO tables or graphics.
- Provide FULL HTML with inline or internal CSS.

Output strict JSON matching the schema.`;

    return await callGeminiWithRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumeRewriteSchema),
        }
    }), 8, "Rewrite");
}
module.exports = { generateAtsAndGaps, generateQuestions, generateRoadmap, generateResumeRewrite }