/**
 * parseResumeHtml.js
 * Parses the AI-generated rewrittenResumeHtml into a structured JSON object
 * that can be used by the resume editor, preview, and PDF templates.
 */

/**
 * @typedef {Object} ResumeData
 * @property {string} name
 * @property {string} title
 * @property {string} phone
 * @property {string} email
 * @property {string} linkedin
 * @property {string} github
 * @property {string} portfolio
 * @property {string} summary
 * @property {string[]} skills
 * @property {Array<{company: string, role: string, dates: string, location: string, bullets: string[]}>} experience
 * @property {Array<{name: string, description: string, tech: string, bullets: string[], sourceUrl: string, demoUrl: string}>} projects
 * @property {Array<{institution: string, degree: string, dates: string, gpa: string}>} education
 * @property {string[]} certifications
 * @property {string[]} achievements
 */

export const DEFAULT_RESUME = {
    name: 'SIDDU KUTCHULA',
    title: 'Software Engineer',
    phone: '+91 6305198912',
    email: 'Siddukuchula62@gmail.com',
    linkedin: 'linkedin.com/in/siddu-kutchula',
    github: 'github.com/SidduKutchula',
    portfolio: 'sidmonai.app',
    summary: 'Full Stack Developer specializing in MERN Stack and AI-powered applications with hands-on experience building scalable web platforms, RESTful APIs, authentication systems, and modern responsive interfaces. Strong understanding of software engineering principles, cloud deployment, database design, and performance optimization. Passionate about solving real-world problems through clean architecture, efficient code, and user-centric product development.',
    skills: [
        'Languages: JavaScript (ES6+), TypeScript, Python, Java, SQL',
        'Frontend: React.js, HTML5, CSS3, Tailwind CSS, Bootstrap, Redux, Responsive Design',
        'Backend & DB: Node.js, Express.js, REST APIs, JWT Authentication, MongoDB, PostgreSQL, Firebase',
        'AI / ML Integration: Python, Scikit-learn, Pandas, NumPy, TensorFlow, Gemini API, OpenAI API',
        'Cloud & DevOps: Git, GitHub, Docker, AWS, Postman, VS Code, Figma',
        'CS Fundamentals: DSA, OOP, DBMS, Operating Systems, Computer Networks, SDLC, Agile, System Design'
    ],
    projects: [
        {
            name: 'Prepnex AI — AI Interview & Career Preparation Platform',
            dates: 'Mar 2026 – Present',
            tech: 'React.js, Node.js, Express.js, MongoDB, Gemini API, JWT, Tailwind CSS',
            sourceUrl: 'https://github.com/SidduKutchula/Prepnex-AI',
            demoUrl: 'https://sidmonai.app',
            bullets: [
                'Built an AI-powered interview preparation platform that analyzes resumes and job descriptions to generate ATS scores, interview questions, and personalized improvement suggestions.',
                'Developed secure JWT authentication with Google OAuth integration and role-based access control.',
                'Implemented responsive dashboards, resume parsing, AI resume rewriting, progress tracking, and interview analytics.',
                'Optimized application performance through reusable React components, API caching strategies, and clean backend architecture.'
            ]
        },
        {
            name: 'AI-Based Project Review Automation System',
            dates: 'Jul 2025 – Nov 2025',
            tech: 'MongoDB, Express.js, React.js, Node.js, JWT, Chart.js',
            sourceUrl: 'https://github.com/SidduKutchula',
            demoUrl: 'https://sidmonai.app',
            bullets: [
                'Developed a comprehensive AI-based project evaluation platform supporting students, mentors, and administrators.',
                'Built secure authentication and role-based dashboards with project review workflows.',
                'Integrated Chart.js analytics dashboards to visualize project performance and review statistics.',
                'Reduced manual evaluation effort by automating report generation and project assessment workflows.'
            ]
        },
        {
            name: 'Student Project Management Platform',
            dates: 'Jan 2025 – Apr 2025',
            tech: 'React.js, Node.js, Express.js, MongoDB',
            sourceUrl: 'https://github.com/SidduKutchula',
            demoUrl: 'https://sidmonai.app',
            bullets: [
                'Designed a centralized platform for project allocation, mentor assignment, and team management.',
                'Implemented admin dashboards with Excel student import and automated team generation.',
                'Built secure authentication, notification workflows, and progress monitoring.',
                'Improved collaboration between students, mentors, and administrators.'
            ]
        }
    ],
    experience: [
        {
            company: 'Technical Hub Pvt Ltd',
            role: 'Full Stack Developer Intern',
            dates: 'May 2025 – Jul 2025',
            bullets: [
                'Developed responsive web applications using React, Python, and Java while following Agile methodologies.',
                'Collaborated with a team of developers to build reusable components and scalable backend APIs.',
                'Improved application performance through code optimization, Git workflows, and modular architecture.',
                'Participated in sprint planning, debugging, testing, and deployment activities.'
            ]
        },
        {
            company: 'CODEXINTERN',
            role: 'Frontend Developer Intern',
            dates: 'Nov 2025 – Jan 2026',
            bullets: [
                'Developed modern React interfaces using reusable UI components.',
                'Implemented Redux-based state management for scalable applications.',
                'Improved application responsiveness and reduced rendering overhead.',
                'Participated in code reviews, bug fixing, and feature implementation.'
            ]
        }
    ],
    achievements: [
        'Smart India Hackathon 2025 Team Leader – INNOVATORS-I nominated by institute.',
        'Oracle Hackathon Finalist among 200+ participating teams.',
        'Technical Quiz Champion securing 1st place among 100+ participants.',
        'Solved 850+ coding problems across LeetCode, CodeChef, HackerRank, and GeeksforGeeks.',
        'Built multiple production-ready full-stack applications with AI integration.'
    ],
    certifications: [
        'Oracle Cloud Infrastructure 2025 — Generative AI Professional (Oracle University)',
        'MongoDB Certified Associate Developer (MongoDB, Inc.)',
        'GitHub Foundations (Microsoft)',
        'Postman API Fundamentals Student Expert (Postman)',
        'Cisco JavaScript Essentials 1 & 2 (Cisco Networking Academy)',
        'Cisco HTML Essentials (Cisco Networking Academy)',
        'Cisco CSS Essentials (Cisco Networking Academy)',
        'Cisco Python Essentials (Cisco Networking Academy)',
        'Cisco Java Essentials (Cisco Networking Academy)',
        'HackerRank Problem Solving (5★)',
        'HackerRank Java (5★)',
        'HackerRank SQL (5★)'
    ],
    education: [
        {
            institution: 'Aditya College of Engineering and Technology, Surampalem',
            degree: 'Bachelor of Technology (B.Tech) - Artificial Intelligence & Machine Learning',
            dates: '2023 – 2027',
            gpa: 'CGPA: 8.1 / 10'
        }
    ]
};

const EMPTY_RESUME = { ...DEFAULT_RESUME };

/**
 * Creates a temporary DOM element from HTML string and extracts text content.
 */
function createDomFromHtml(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container;
}

/**
 * Extracts a URL from an anchor element, or from text that looks like a URL.
 */
function extractUrl(text) {
    if (!text) return '';
    // Match URLs
    const urlMatch = text.match(/https?:\/\/[^\s<>"]+/i);
    return urlMatch ? urlMatch[0] : '';
}

/**
 * Extracts email from text.
 */
function extractEmail(text) {
    if (!text) return '';
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : '';
}

/**
 * Extracts phone from text.
 */
function extractPhone(text) {
    if (!text) return '';
    const phoneMatch = text.match(/[\+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}/);
    return phoneMatch ? phoneMatch[0].trim() : '';
}

/**
 * Determines if a text block is a section heading based on common patterns.
 */
function isSectionHeading(el) {
    const tag = el.tagName?.toLowerCase();
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return true;
    // Check for bold/strong standalone text that looks like a heading
    if (tag === 'p' || tag === 'div') {
        const strong = el.querySelector('strong, b');
        if (strong && strong.textContent.trim() === el.textContent.trim()) {
            return el.textContent.trim().length < 60;
        }
    }
    return false;
}

/**
 * Maps a heading text to a resume section name.
 */
function classifySection(headingText) {
    const t = headingText.toLowerCase().trim().replace(/[^a-z\s]/g, '');
    
    if (/summary|objective|profile|about/.test(t)) return 'summary';
    if (/technical\s*skill|skill|tech\s*stack|technologies|competenc/.test(t)) return 'skills';
    if (/experience|work\s*history|employment|professional\s*experience/.test(t)) return 'experience';
    if (/project/.test(t)) return 'projects';
    if (/education|academic/.test(t)) return 'education';
    if (/certif/.test(t)) return 'certifications';
    if (/achieve|award|honor|recognition/.test(t)) return 'achievements';
    if (/contact|info/.test(t)) return 'contact';
    
    return 'unknown';
}

/**
 * Extracts bullet points from a container (ul, ol, or p elements).
 */
function extractBullets(container) {
    const bullets = [];
    const listItems = container.querySelectorAll('li');
    if (listItems.length > 0) {
        listItems.forEach(li => {
            const text = li.textContent.trim();
            if (text) bullets.push(text);
        });
    } else {
        // Fall back to paragraph-style bullets
        const paragraphs = container.querySelectorAll('p');
        paragraphs.forEach(p => {
            const text = p.textContent.trim();
            if (text && text.length > 10) bullets.push(text);
        });
    }
    return bullets;
}

/**
 * Parse contact info from the top of the resume (name, title, links).
 */
function parseContactBlock(dom) {
    const contact = { name: '', title: '', phone: '', email: '', linkedin: '', github: '', portfolio: '' };
    
    // Name is typically the first h1 or largest heading
    const h1 = dom.querySelector('h1');
    if (h1) {
        contact.name = h1.textContent.trim();
    }
    
    // Look for links
    const links = dom.querySelectorAll('a[href]');
    links.forEach(link => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent.toLowerCase();
        
        if (href.includes('linkedin.com') || text.includes('linkedin')) {
            contact.linkedin = href;
        } else if (href.includes('github.com') || text.includes('github')) {
            contact.github = href;
        } else if (href.startsWith('mailto:')) {
            contact.email = href.replace('mailto:', '');
        } else if (href.startsWith('tel:')) {
            contact.phone = href.replace('tel:', '');
        } else if (href.includes('portfolio') || text.includes('portfolio') || text.includes('website')) {
            contact.portfolio = href;
        }
    });
    
    // Extract email and phone from full text if not found in links
    const fullText = dom.textContent;
    if (!contact.email) contact.email = extractEmail(fullText);
    if (!contact.phone) contact.phone = extractPhone(fullText);
    
    // Try to find title (usually right after name or in a subtitle)
    const h2 = dom.querySelector('h2');
    if (h2 && !classifySection(h2.textContent).match(/summary|skill|experience|project|education|certif|achieve/)) {
        contact.title = h2.textContent.trim();
    }
    
    // If no h2 title, check for a subtitle-looking paragraph near the top
    if (!contact.title) {
        const firstParagraphs = dom.querySelectorAll('p');
        for (const p of firstParagraphs) {
            const text = p.textContent.trim();
            if (text.length > 3 && text.length < 80 && !extractEmail(text) && !extractPhone(text) && !text.includes('http')) {
                // Likely a title/subtitle
                contact.title = text;
                break;
            }
        }
    }
    
    return contact;
}

/**
 * Main parser: converts rewrittenResumeHtml to structured ResumeData.
 * 
 * @param {string} html - The AI-generated resume HTML
 * @param {Object} [reportData] - Additional data from the interview report
 * @returns {ResumeData}
 */
export function parseResumeHtml(html, reportData = {}) {
    if (!html || typeof html !== 'string') {
        const empty = { ...EMPTY_RESUME };
        if (reportData.selfDescription) empty.summary = reportData.selfDescription;
        if (reportData.addedKeywords) empty.skills = reportData.addedKeywords;
        return empty;
    }
    
    // Strip markdown code fences
    const cleanHtml = html.replace(/```html/gi, '').replace(/```/gi, '').trim();
    const dom = createDomFromHtml(cleanHtml);
    const result = { ...EMPTY_RESUME };
    
    // 1. Parse contact info from top
    const contact = parseContactBlock(dom);
    Object.assign(result, contact);
    
    // 2. Extract and flatten elements
    let current = dom;
    while (
        current.children.length === 1 &&
        ['html', 'body', 'div', 'main', 'article', 'section'].includes(current.firstElementChild?.tagName?.toLowerCase())
    ) {
        current = current.firstElementChild;
    }

    const rawChildren = Array.from(current.children);
    const allElements = [];
    rawChildren.forEach(child => {
        const tag = child.tagName?.toLowerCase();
        const childHeadings = child.querySelectorAll?.('h1, h2, h3, h4, h5, h6');
        if (['section', 'div', 'article'].includes(tag) && childHeadings && childHeadings.length > 0 && !['h1','h2','h3','h4','h5','h6'].includes(tag)) {
            allElements.push(...Array.from(child.children));
        } else {
            allElements.push(child);
        }
    });

    let currentSection = null;
    let sectionContent = [];
    
    const flushSection = () => {
        if (!currentSection || sectionContent.length === 0) return;
        
        const wrapper = document.createElement('div');
        sectionContent.forEach(el => wrapper.appendChild(el.cloneNode(true)));
        
        switch (currentSection) {
            case 'summary': {
                const texts = [];
                wrapper.querySelectorAll('p').forEach(p => {
                    const t = p.textContent.trim();
                    if (t) texts.push(t);
                });
                if (texts.length === 0) {
                    // Might be in non-p text
                    const t = wrapper.textContent.trim();
                    if (t) texts.push(t);
                }
                result.summary = texts.join(' ');
                break;
            }
            case 'skills': {
                const skills = [];
                // Check for list items
                wrapper.querySelectorAll('li').forEach(li => {
                    const t = li.textContent.trim();
                    if (t) skills.push(t);
                });
                // Check for comma-separated or pipe-separated text
                if (skills.length === 0) {
                    const text = wrapper.textContent.trim();
                    const separated = text.split(/[,|•·]/).map(s => s.trim()).filter(s => s.length > 0);
                    skills.push(...separated);
                }
                result.skills = skills;
                break;
            }
            case 'experience': {
                const entries = [];
                // Look for patterns: role/company + date + bullets
                const headings = wrapper.querySelectorAll('h3, h4, strong, b');
                const expSections = [];
                
                headings.forEach(h => {
                    const text = h.textContent.trim();
                    if (text.length > 3 && text.length < 200) {
                        expSections.push({ heading: text, element: h });
                    }
                });
                
                // Group content between headings
                if (expSections.length > 0) {
                    for (let i = 0; i < expSections.length; i += 1) {
                        const text = expSections[i].heading;
                        // Try to split "Role at Company" or "Role | Company" or "Company - Role"
                        let role = text, company = '';
                        const splitPatterns = [/ at /i, / \| /i, / [-–—] /i, / @ /i];
                        for (const pat of splitPatterns) {
                            if (pat.test(text)) {
                                const parts = text.split(pat);
                                role = parts[0].trim();
                                company = parts.slice(1).join(' ').trim();
                                break;
                            }
                        }
                        
                        // Collect bullets until next heading
                        const entry = { company, role, dates: '', location: '', bullets: [] };
                        
                        let sibling = expSections[i].element.nextElementSibling;
                        while (sibling && !['H3', 'H4'].includes(sibling.tagName)) {
                            const sibText = sibling.textContent.trim();
                            // Date detection
                            if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|20\d{2}|19\d{2}|present|current)\b/i.test(sibText) && sibText.length < 80 && !entry.dates) {
                                entry.dates = sibText;
                            } else if (sibling.tagName === 'UL' || sibling.tagName === 'OL') {
                                sibling.querySelectorAll('li').forEach(li => {
                                    const t = li.textContent.trim();
                                    if (t) entry.bullets.push(t);
                                });
                            } else if (sibText && sibText.length > 15) {
                                entry.bullets.push(sibText);
                            }
                            sibling = sibling.nextElementSibling;
                        }
                        
                        entries.push(entry);
                    }
                }
                
                result.experience = entries.length > 0 ? entries : [];
                break;
            }
            case 'projects': {
                const entries = [];
                const headings = wrapper.querySelectorAll('h3, h4, strong, b');
                
                headings.forEach(h => {
                    const name = h.textContent.trim();
                    if (name.length > 2 && name.length < 150) {
                        const entry = { name, description: '', tech: '', bullets: [], sourceUrl: '', demoUrl: '' };
                        
                        let sibling = h.nextElementSibling;
                        while (sibling && !['H3', 'H4'].includes(sibling.tagName)) {
                            if (sibling.tagName === 'UL' || sibling.tagName === 'OL') {
                                sibling.querySelectorAll('li').forEach(li => {
                                    const t = li.textContent.trim();
                                    if (t) entry.bullets.push(t);
                                });
                            } else {
                                const text = sibling.textContent.trim();
                                if (/tech|stack|built\s*with/i.test(text)) {
                                    entry.tech = text.replace(/^(tech|stack|built\s*with)[:\s]*/i, '');
                                } else if (text && text.length > 10) {
                                    if (!entry.description) entry.description = text;
                                    else entry.bullets.push(text);
                                }
                            }
                            
                            // Extract links
                            const links = sibling.querySelectorAll?.('a[href]') || [];
                            links.forEach(a => {
                                const href = a.getAttribute('href');
                                const label = a.textContent.toLowerCase();
                                if (label.includes('source') || label.includes('github') || label.includes('code')) {
                                    entry.sourceUrl = href;
                                } else if (label.includes('demo') || label.includes('live') || label.includes('deploy')) {
                                    entry.demoUrl = href;
                                }
                            });
                            
                            sibling = sibling.nextElementSibling;
                        }
                        
                        entries.push(entry);
                    }
                });
                
                result.projects = entries;
                break;
            }
            case 'education': {
                const entries = [];
                const headings = wrapper.querySelectorAll('h3, h4, strong, b');
                
                if (headings.length > 0) {
                    headings.forEach(h => {
                        const text = h.textContent.trim();
                        const entry = { institution: '', degree: text, dates: '', gpa: '' };
                        
                        let sibling = h.nextElementSibling;
                        while (sibling && !['H3', 'H4'].includes(sibling.tagName)) {
                            const t = sibling.textContent.trim();
                            if (/\b(university|college|institute|school)\b/i.test(t)) {
                                entry.institution = t;
                            } else if (/\b(20\d{2}|19\d{2}|present)\b/i.test(t) && t.length < 60) {
                                entry.dates = t;
                            } else if (/gpa|cgpa|grade/i.test(t)) {
                                entry.gpa = t;
                            }
                            sibling = sibling.nextElementSibling;
                        }
                        
                        entries.push(entry);
                    });
                } else {
                    // Simple text-based education
                    const text = wrapper.textContent.trim();
                    if (text) {
                        entries.push({ institution: '', degree: text, dates: '', gpa: '' });
                    }
                }
                
                result.education = entries;
                break;
            }
            case 'certifications': {
                result.certifications = extractBullets(wrapper).length > 0 
                    ? extractBullets(wrapper)
                    : wrapper.textContent.split('\n').map(s => s.trim()).filter(s => s.length > 3);
                break;
            }
            case 'achievements': {
                result.achievements = extractBullets(wrapper).length > 0
                    ? extractBullets(wrapper)
                    : wrapper.textContent.split('\n').map(s => s.trim()).filter(s => s.length > 3);
                break;
            }
        }
    };
    
    for (const el of allElements) {
        if (isSectionHeading(el)) {
            // Flush previous section
            flushSection();
            currentSection = classifySection(el.textContent);
            sectionContent = [];
        } else {
            sectionContent.push(el);
        }
    }
    // Flush last section
    flushSection();
    
    // 3. Supplement contact info if missing
    if (!result.name || result.name.trim() === '' || result.name === 'Candidate Name') {
        result.name = reportData.candidateName || reportData.user?.name || reportData.user?.displayName || 'CANDIDATE NAME';
    }
    if (!result.title || result.title === 'Target Job Role') {
        result.title = reportData.title || '';
    }

    // Clean AI meta text from summary if present
    if (result.summary && (result.summary.toLowerCase().includes('mapping jd') || result.summary.toLowerCase().includes('synthesized'))) {
        result.summary = result.summary.replace(/mapping jd|synthesized/gi, '').trim();
    }

    return result;
}

/**
 * Creates a default ResumeData object with empty fields.
 */
export function createEmptyResume() {
    return { ...EMPTY_RESUME };
}

export default parseResumeHtml;
