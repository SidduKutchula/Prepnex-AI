/**
 * Conversational Resume Builder Service
 * 
 * Inspired by Mayank0255/Resume-Bot, this service provides an interactive,
 * multi-step conversational state machine to construct a complete professional
 * resume directly through chat (Web, WhatsApp, and Slack).
 */

const { getOpenRouterClient } = require("../config/openrouter.client");
const { OPENROUTER_MODEL } = require("../config/ai.config");

const SECTIONS = {
    BEGIN: "begin",
    HEADER: "header",
    EDUCATION: "education",
    SKILLS: "skills",
    EXPERIENCE: "experience",
    PROJECTS: "projects",
    CERTIFICATIONS: "certifications",
    FINALIZE: "finalize",
};

/**
 * Initialize resume builder state on a conversation.
 */
function startBuilder(conversation) {
    conversation.state = "resume_builder";
    conversation.resumeBuilderState = {
        active: true,
        currentSection: SECTIONS.BEGIN,
        stepIndex: 0,
        tempItem: {},
        data: {
            name: "",
            title: "",
            email: "",
            phone: "",
            linkedin: "",
            github: "",
            portfolio: "",
            summary: "",
            skills: [],
            education: [],
            experience: [],
            projects: [],
            achievements: [],
            certifications: [],
        },
    };

    return {
        answer: "👋 *Welcome to the PrepNex AI Resume Builder!*\n\n" +
            "I'll guide you step-by-step through creating an ATS-optimized resume right here in chat.\n" +
            "We'll cover your **Contact Info**, **Education**, **Skills**, **Experience**, and **Projects**.\n\n" +
            "Ready to begin? (Takes about 5 minutes)",
        actions: [
            { type: "button", label: "Yes, let's begin!", value: "Yes, let's begin!" },
            { type: "button", label: "Not now", value: "Not now" },
        ],
    };
}

/**
 * Handle each step of the conversational state machine.
 */
async function handleStep(conversation, message) {
    const state = conversation.resumeBuilderState;
    if (!state || !state.active) {
        return startBuilder(conversation);
    }

    const trimmed = message.trim();
    const isSkip = trimmed.toLowerCase() === "not now" ||
        trimmed.toLowerCase().includes("skip") ||
        trimmed.toLowerCase() === "i don't have that!" ||
        trimmed.toLowerCase() === "i don't have that";

    switch (state.currentSection) {
        case SECTIONS.BEGIN: {
            if (trimmed.toLowerCase().includes("not now") || trimmed.toLowerCase() === "no") {
                state.active = false;
                conversation.state = "idle";
                return {
                    answer: "No problem! You can type `/build` whenever you're ready to create your resume.",
                    actions: [{ type: "button", label: "Start Resume Builder", value: "/build" }],
                };
            }
            // Move to HEADER section
            state.currentSection = SECTIONS.HEADER;
            state.stepIndex = 0;
            return {
                answer: "🎉 *Awesome, let's build it!*\n\nFirst, what is your **Full Name**?",
                actions: [],
            };
        }

        case SECTIONS.HEADER: {
            return handleHeaderSection(state, trimmed, isSkip);
        }

        case SECTIONS.EDUCATION: {
            return handleEducationSection(state, trimmed, isSkip);
        }

        case SECTIONS.SKILLS: {
            return handleSkillsSection(state, trimmed, isSkip);
        }

        case SECTIONS.EXPERIENCE: {
            return handleExperienceSection(state, trimmed, isSkip);
        }

        case SECTIONS.PROJECTS: {
            return handleProjectsSection(state, trimmed, isSkip);
        }

        case SECTIONS.CERTIFICATIONS: {
            return handleCertificationsSection(conversation, state, trimmed, isSkip);
        }

        default: {
            state.active = false;
            conversation.state = "idle";
            return {
                answer: "Resume building is complete. Type `/build` to start again.",
                actions: [],
            };
        }
    }
}

// ─── Section Handlers ────────────────────────────────────────────────────────

function handleHeaderSection(state, input, isSkip) {
    const step = state.stepIndex;

    if (step === 0) {
        state.data.name = input;
        state.stepIndex = 1;
        return {
            answer: `Nice to meet you, **${input}**! 👋\n\nWhat is your **Target Job Title** or professional headline? (e.g., _Software Engineer_, _Full Stack Developer_, _Product Manager_)`,
            actions: [],
        };
    } else if (step === 1) {
        state.data.title = input;
        state.stepIndex = 2;
        return {
            answer: "What is your **Email Address**?",
            actions: [],
        };
    } else if (step === 2) {
        state.data.email = input;
        state.stepIndex = 3;
        return {
            answer: "What is your **Phone Number** with country code?",
            actions: [],
        };
    } else if (step === 3) {
        state.data.phone = input;
        state.stepIndex = 4;
        return {
            answer: "What is your **LinkedIn Profile URL**?",
            actions: [{ type: "button", label: "I don't have that!", value: "I don't have that!" }],
        };
    } else if (step === 4) {
        state.data.linkedin = isSkip ? "" : input;
        state.stepIndex = 5;
        return {
            answer: "What is your **GitHub or Portfolio Website URL**?",
            actions: [{ type: "button", label: "I don't have that!", value: "I don't have that!" }],
        };
    } else if (step === 5) {
        state.data.portfolio = isSkip ? "" : input;
        // Header complete, move to EDUCATION
        state.currentSection = SECTIONS.EDUCATION;
        state.stepIndex = 0;
        state.tempItem = {};
        return {
            answer: "✅ *Contact info saved!*\n\nNext section: **Education**.\nWould you like to add an education entry, or skip this section?",
            actions: [
                { type: "button", label: "Add Education", value: "Add Education" },
                { type: "button", label: "Skip Education", value: "Skip Education" },
            ],
        };
    }
}

function handleEducationSection(state, input, isSkip) {
    const step = state.stepIndex;

    if (step === 0) {
        if (isSkip || input.toLowerCase().includes("skip")) {
            // Move to SKILLS
            state.currentSection = SECTIONS.SKILLS;
            state.stepIndex = 0;
            return {
                answer: "Skipped education.\n\nNext: **Skills**.\nWhat are your top **Technical Skills, Languages & Frameworks**? (comma-separated, e.g., _React, Node.js, Python, MongoDB, SQL, Git_)",
                actions: [],
            };
        }
        state.tempItem = {};
        state.stepIndex = 1;
        return {
            answer: "What is your **College / University / School Name**?",
            actions: [],
        };
    } else if (step === 1) {
        state.tempItem.institution = input;
        state.stepIndex = 2;
        return {
            answer: "Where is it located? (City, State or Country)",
            actions: [],
        };
    } else if (step === 2) {
        state.tempItem.location = input;
        state.stepIndex = 3;
        return {
            answer: "What **Degree & Major** did you pursue? (e.g., _B.Tech in Computer Science_)",
            actions: [],
        };
    } else if (step === 3) {
        state.tempItem.degree = input;
        state.stepIndex = 4;
        return {
            answer: "What was your **Graduation Year / Dates** and **GPA / Percentage**? (e.g., _2022 – 2026, 8.5 CGPA_)",
            actions: [],
        };
    } else if (step === 4) {
        state.tempItem.dates = input;
        state.data.education.push({ ...state.tempItem });
        state.tempItem = {};
        state.stepIndex = 5;
        return {
            answer: "🎓 *Education entry added!*\n\nWould you like to add another education entry?",
            actions: [
                { type: "button", label: "Add Another", value: "Add another education" },
                { type: "button", label: "Done, Next Section", value: "Done with Education" },
            ],
        };
    } else if (step === 5) {
        if (input.toLowerCase().includes("another") || input.toLowerCase() === "yes") {
            state.stepIndex = 1;
            state.tempItem = {};
            return {
                answer: "What is the **College / University Name** for the next entry?",
                actions: [],
            };
        }
        // Move to SKILLS
        state.currentSection = SECTIONS.SKILLS;
        state.stepIndex = 0;
        return {
            answer: "Next section: **Skills**.\n\nWhat are your top **Technical Skills, Languages, Tools & Frameworks**? (comma-separated, e.g., _JavaScript, React, Node.js, Express, MongoDB, Docker, Git_)",
            actions: [],
        };
    }
}

function handleSkillsSection(state, input, isSkip) {
    if (isSkip) {
        state.data.skills = ["Software Development", "Problem Solving", "Team Collaboration"];
    } else {
        const parsedSkills = input.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
        state.data.skills = parsedSkills.length > 0 ? parsedSkills : [input.trim()];
    }

    // Move to EXPERIENCE
    state.currentSection = SECTIONS.EXPERIENCE;
    state.stepIndex = 0;
    state.tempItem = {};
    return {
        answer: `⚡ *Added ${state.data.skills.length} skills!*\n\nNext section: **Work Experience**.\nWould you like to add work experience / internships, or skip to projects?`,
        actions: [
            { type: "button", label: "Add Experience", value: "Add Experience" },
            { type: "button", label: "Skip Experience", value: "Skip Experience" },
        ],
    };
}

function handleExperienceSection(state, input, isSkip) {
    const step = state.stepIndex;

    if (step === 0) {
        if (isSkip || input.toLowerCase().includes("skip")) {
            state.currentSection = SECTIONS.PROJECTS;
            state.stepIndex = 0;
            return {
                answer: "Skipped work experience.\n\nNext: **Projects**.\nWould you like to add your technical projects?",
                actions: [
                    { type: "button", label: "Add Projects", value: "Add Projects" },
                    { type: "button", label: "Skip Projects", value: "Skip Projects" },
                ],
            };
        }
        state.tempItem = {};
        state.stepIndex = 1;
        return {
            answer: "What is the **Company / Organization Name**?",
            actions: [],
        };
    } else if (step === 1) {
        state.tempItem.company = input;
        state.stepIndex = 2;
        return {
            answer: "What was your **Role / Job Title**?",
            actions: [],
        };
    } else if (step === 2) {
        state.tempItem.role = input;
        state.stepIndex = 3;
        return {
            answer: "What were the **Dates / Duration** and Location? (e.g., _Jan 2024 – Present, Bengaluru_)",
            actions: [],
        };
    } else if (step === 3) {
        state.tempItem.dates = input;
        state.stepIndex = 4;
        return {
            answer: "Briefly describe your key responsibilities and achievements in this role (don't worry about wording, AI will polish it into strong bullet points):",
            actions: [],
        };
    } else if (step === 4) {
        state.tempItem.bullets = [input];
        state.data.experience.push({ ...state.tempItem });
        state.tempItem = {};
        state.stepIndex = 5;
        return {
            answer: "💼 *Experience entry saved!*\n\nWould you like to add another work experience?",
            actions: [
                { type: "button", label: "Add Another", value: "Add another experience" },
                { type: "button", label: "Done, Next Section", value: "Done with Experience" },
            ],
        };
    } else if (step === 5) {
        if (input.toLowerCase().includes("another") || input.toLowerCase() === "yes") {
            state.stepIndex = 1;
            state.tempItem = {};
            return {
                answer: "What is the **Company Name** for the next entry?",
                actions: [],
            };
        }
        // Move to PROJECTS
        state.currentSection = SECTIONS.PROJECTS;
        state.stepIndex = 0;
        return {
            answer: "Next section: **Projects**.\nWould you like to add your technical projects?",
            actions: [
                { type: "button", label: "Add Project", value: "Add Project" },
                { type: "button", label: "Skip Projects", value: "Skip Projects" },
            ],
        };
    }
}

function handleProjectsSection(state, input, isSkip) {
    const step = state.stepIndex;

    if (step === 0) {
        if (isSkip || input.toLowerCase().includes("skip")) {
            state.currentSection = SECTIONS.CERTIFICATIONS;
            state.stepIndex = 0;
            return {
                answer: "Skipped projects.\n\nNext: **Certifications & Achievements**.\nWould you like to add any certifications or honors?",
                actions: [
                    { type: "button", label: "Add Certifications", value: "Add Certifications" },
                    { type: "button", label: "Skip Certifications", value: "Skip Certifications" },
                ],
            };
        }
        state.tempItem = {};
        state.stepIndex = 1;
        return {
            answer: "What is the **Project Name**?",
            actions: [],
        };
    } else if (step === 1) {
        state.tempItem.name = input;
        state.stepIndex = 2;
        return {
            answer: "What **Technologies / Tech Stack** did you use? (e.g., _React, Node.js, MongoDB, Gemini API_)",
            actions: [],
        };
    } else if (step === 2) {
        state.tempItem.tech = input;
        state.stepIndex = 3;
        return {
            answer: "Briefly describe what this project does and what you built:",
            actions: [],
        };
    } else if (step === 3) {
        state.tempItem.bullets = [input];
        state.stepIndex = 4;
        return {
            answer: "Do you have a **GitHub or Live Demo link** for this project?",
            actions: [{ type: "button", label: "I don't have that!", value: "I don't have that!" }],
        };
    } else if (step === 4) {
        state.tempItem.sourceUrl = isSkip ? "" : input;
        state.data.projects.push({ ...state.tempItem });
        state.tempItem = {};
        state.stepIndex = 5;
        return {
            answer: "🚀 *Project saved!*\n\nWould you like to add another project?",
            actions: [
                { type: "button", label: "Add Another", value: "Add another project" },
                { type: "button", label: "Done, Next Section", value: "Done with Projects" },
            ],
        };
    } else if (step === 5) {
        if (input.toLowerCase().includes("another") || input.toLowerCase() === "yes") {
            state.stepIndex = 1;
            state.tempItem = {};
            return {
                answer: "What is the **Project Name** for the next project?",
                actions: [],
            };
        }
        // Move to CERTIFICATIONS
        state.currentSection = SECTIONS.CERTIFICATIONS;
        state.stepIndex = 0;
        return {
            answer: "Final section: **Certifications & Achievements**.\nWould you like to add any certifications, licenses, or honors?",
            actions: [
                { type: "button", label: "Add Certifications", value: "Add Certifications" },
                { type: "button", label: "Finish Resume", value: "Finish Resume" },
            ],
        };
    }
}

async function handleCertificationsSection(conversation, state, input, isSkip) {
    const step = state.stepIndex;

    if (step === 0) {
        if (isSkip || input.toLowerCase().includes("finish") || input.toLowerCase().includes("skip")) {
            return finalizeResume(conversation, state);
        }
        state.stepIndex = 1;
        return {
            answer: "Please list your certifications, awards, or achievements (comma-separated or on separate lines):",
            actions: [],
        };
    } else if (step === 1) {
        if (!isSkip) {
            const certs = input.split(/[,;\n]/).map(c => c.trim()).filter(Boolean);
            state.data.certifications = certs;
        }
        return finalizeResume(conversation, state);
    }
}

// ─── Finalization & Construction ─────────────────────────────────────────────

async function finalizeResume(conversation, state) {
    const resumeData = state.data;

    // Generate polished professional summary using OpenRouter
    let summary = "";
    try {
        const client = getOpenRouterClient();
        if (client) {
            const prompt = `Generate a high-impact, professional 2-sentence resume summary for this candidate:
Name: ${resumeData.name}
Target Role: ${resumeData.title || "Software Engineer"}
Skills: ${resumeData.skills.join(", ")}
Experience: ${JSON.stringify(resumeData.experience)}
Projects: ${JSON.stringify(resumeData.projects)}

Keep it ATS-friendly, active voice, strictly 2 sentences. No conversational filler.`;

            const resp = await client.chat.completions.create({
                model: OPENROUTER_MODEL,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert resume writer. Generate high-impact, ATS-friendly professional summaries."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 150
            });
            summary = (resp.choices[0]?.message?.content || "").trim();
        }
    } catch (err) {
        console.warn("[ResumeBuilder] Summary generation failed:", err.message);
    }

    if (!summary) {
        summary = `${resumeData.title || "Professional"} with proven expertise in ${resumeData.skills.slice(0, 4).join(", ") || "software engineering"}. Dedicated to building scalable solutions and delivering high-impact results.`;
    }
    resumeData.summary = summary;

    // Format full markdown preview
    let md = `# ${resumeData.name || "Candidate"}\n`;
    if (resumeData.title) md += `**${resumeData.title}**\n\n`;
    const contactParts = [];
    if (resumeData.email) contactParts.push(resumeData.email);
    if (resumeData.phone) contactParts.push(resumeData.phone);
    if (resumeData.linkedin) contactParts.push(resumeData.linkedin);
    if (resumeData.portfolio) contactParts.push(resumeData.portfolio);
    if (contactParts.length > 0) md += `${contactParts.join(" | ")}\n\n`;

    md += `## Professional Summary\n${resumeData.summary}\n\n`;

    if (resumeData.skills.length > 0) {
        md += `## Skills\n${resumeData.skills.join(" • ")}\n\n`;
    }

    if (resumeData.experience.length > 0) {
        md += `## Work Experience\n`;
        for (const exp of resumeData.experience) {
            md += `### ${exp.role || "Role"} at ${exp.company || "Company"}\n`;
            if (exp.dates) md += `_${exp.dates}_\n`;
            if (exp.bullets) {
                for (const b of exp.bullets) md += `- ${b}\n`;
            }
            md += `\n`;
        }
    }

    if (resumeData.projects.length > 0) {
        md += `## Projects\n`;
        for (const prj of resumeData.projects) {
            md += `### ${prj.name || "Project"}\n`;
            if (prj.tech) md += `*Tech Stack:* ${prj.tech}\n`;
            if (prj.bullets) {
                for (const b of prj.bullets) md += `- ${b}\n`;
            }
            if (prj.sourceUrl) md += `*Link:* ${prj.sourceUrl}\n`;
            md += `\n`;
        }
    }

    if (resumeData.education.length > 0) {
        md += `## Education\n`;
        for (const edu of resumeData.education) {
            md += `### ${edu.degree || "Degree"} — ${edu.institution || "Institution"}\n`;
            if (edu.dates) md += `_${edu.dates}_\n`;
            md += `\n`;
        }
    }

    // Save as current resume in conversation
    conversation.currentResume = md;
    state.active = false;
    conversation.state = "idle";

    const clientUrl = process.env.CLIENT_URL || "https://sidmonai.app";

    return {
        answer: `🎉 *Resume Construction Complete!*\n\n` +
            `Here is your new resume for **${resumeData.name}** (${resumeData.title || "Target Role"}):\n\n` +
            md +
            `\n👉 What would you like to do next?`,
        actions: [
            { type: "link", label: "Open in Resume Editor", value: `${clientUrl}/resume` },
            { type: "button", label: "Analyze with ATS", value: "/analyze" },
            { type: "button", label: "Generate Prep Plan", value: "/plan" },
            { type: "button", label: "Practice Mock Interview", value: "/mock" },
        ],
    };
}

module.exports = {
    SECTIONS,
    startBuilder,
    handleStep,
};
