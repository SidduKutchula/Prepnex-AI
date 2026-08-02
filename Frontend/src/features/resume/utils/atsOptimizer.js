/**
 * atsOptimizer.js
 * Pre-processes and normalizes resume data for optimal ATS parsing and PDF rendering.
 * Performs tech name normalization, capitalization fixes, whitespace cleanup,
 * punctuation correction, and removal of blank sections/empty bullets.
 */

// Dictionary for technology name normalization
const TECH_DICTIONARY = {
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'react': 'React.js',
    'reactjs': 'React.js',
    'react.js': 'React.js',
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'node.js': 'Node.js',
    'express': 'Express.js',
    'expressjs': 'Express.js',
    'express.js': 'Express.js',
    'vue': 'Vue.js',
    'vuejs': 'Vue.js',
    'vue.js': 'Vue.js',
    'next': 'Next.js',
    'nextjs': 'Next.js',
    'next.js': 'Next.js',
    'nuxt': 'Nuxt.js',
    'nuxtjs': 'Nuxt.js',
    'mongo': 'MongoDB',
    'mongodb': 'MongoDB',
    'postgres': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'mysql': 'MySQL',
    'redis': 'Redis',
    'docker': 'Docker',
    'k8s': 'Kubernetes',
    'kubernetes': 'Kubernetes',
    'aws': 'AWS',
    'gcp': 'Google Cloud Platform',
    'azure': 'Microsoft Azure',
    'graphql': 'GraphQL',
    'rest': 'REST API',
    'restful': 'RESTful API',
    'html': 'HTML5',
    'html5': 'HTML5',
    'css': 'CSS3',
    'css3': 'CSS3',
    'sass': 'Sass/SCSS',
    'scss': 'Sass/SCSS',
    'tailwind': 'Tailwind CSS',
    'tailwindcss': 'Tailwind CSS',
    'git': 'Git',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'cicd': 'CI/CD',
    'ci/cd': 'CI/CD',
    'webpack': 'Webpack',
    'vite': 'Vite',
    'python': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c#': 'C#',
    'golang': 'Go',
    'go': 'Go',
    'rust': 'Rust',
    'redux': 'Redux',
    'zustand': 'Zustand'
};

/**
 * Normalizes a single tech name string based on the dictionary.
 */
export function normalizeTechName(tech) {
    if (!tech || typeof tech !== 'string') return '';
    const clean = tech.trim();
    const lower = clean.toLowerCase();
    return TECH_DICTIONARY[lower] || clean;
}

export function groupSkillsIntoCategories(rawSkills) {
    if (!rawSkills || !Array.isArray(rawSkills) || rawSkills.length === 0) return [];

    const canonicalBuckets = [
        {
            category: 'Frontend',
            match: ['React.js', 'React Native', 'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Redux', 'Vue.js', 'Next.js']
        },
        {
            category: 'Backend & DB',
            match: ['Node.js', 'Express.js', 'RESTful APIs', 'REST APIs', 'JWT', 'MongoDB', 'PostgreSQL', 'SQL', 'Firebase']
        },
        {
            category: 'Languages',
            match: ['Java', 'Python', 'JavaScript (ES6+)', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go']
        },
        {
            category: 'AI/ML Integration',
            match: ['OpenAI API', 'Scikit-learn', 'Pandas', 'NumPy', 'TensorFlow', 'Gemini API', 'Machine Learning']
        },
        {
            category: 'Cloud & DevOps',
            match: ['AWS', 'Docker', 'Git', 'GitHub', 'Postman', 'VS Code', 'Figma', 'GitHub Actions', 'Render']
        },
        {
            category: 'CS Fundamentals',
            match: ['Agile Scrum', 'SDLC', 'System Design', 'DSA', 'OOP', 'DBMS', 'Computer Networks', 'Operating Systems']
        }
    ];

    const displayOrder = ['Languages', 'Frontend', 'Backend & DB', 'AI/ML Integration', 'Cloud & DevOps', 'CS Fundamentals'];

    const noiseHeaders = [
        'frontend', 'languages', 'backend', 'backend & db', 'react native backend & db',
        'firebase tools & devops', 'tools & devops', 'cloud & devops',
        'github actions methodology & ml', 'methodology & ml', 'cs fundamentals',
        'ai/ml integration', 'other skills', 'cs & engineering', 'technical proficiencies'
    ];

    const tokens = [];
    rawSkills.forEach(item => {
        if (!item || typeof item !== 'string') return;
        const cleaned = cleanText(item);
        if (!cleaned) return;

        const subVals = cleaned.includes(':') 
            ? cleaned.split(':')[1].split(/[,|•·]/) 
            : cleaned.split(/[,|•·]/);

        subVals.forEach(v => {
            const c = cleanText(v);
            if (c && !noiseHeaders.includes(c.toLowerCase())) {
                tokens.push(c);
            }
        });
    });

    const uniqueTokens = Array.from(new Set(tokens));

    const bucketMap = {};
    const unassigned = [];

    uniqueTokens.forEach(token => {
        let matchedCategory = null;

        for (const b of canonicalBuckets) {
            if (b.match.some(m => token.toLowerCase() === m.toLowerCase() || token.toLowerCase().includes(m.toLowerCase()))) {
                matchedCategory = b.category;
                break;
            }
        }

        if (matchedCategory) {
            if (!bucketMap[matchedCategory]) bucketMap[matchedCategory] = [];
            if (!bucketMap[matchedCategory].includes(token)) bucketMap[matchedCategory].push(token);
        } else {
            if (!noiseHeaders.includes(token.toLowerCase()) && token.length > 1) {
                unassigned.push(token);
            }
        }
    });

    const result = [];
    displayOrder.forEach(catName => {
        const list = bucketMap[catName];
        if (list && list.length > 0) {
            result.push(`${catName}: ${list.join(', ')}`);
        }
    });

    if (unassigned.length > 0) {
        result.push(`Other Technologies: ${unassigned.join(', ')}`);
    }

    return result.length > 0 ? result : rawSkills.map(cleanText);
}

/**
 * Cleans whitespace, double spaces, leading/trailing punctuation.
 */
export function cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/\s+/g, ' ')               // Collapse double spaces
        .replace(/\s+([.,;:!?])/g, '$1')   // Fix spaces before punctuation
        .trim();
}

/**
 * Clean and normalize a bullet point statement for maximum impact and proper punctuation.
 */
export function cleanBulletPoint(bullet) {
    if (!bullet || typeof bullet !== 'string') return '';
    let cleaned = cleanText(bullet);
    
    // Capitalize first letter
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    // Ensure it ends with a period if it's a full sentence
    if (cleaned.length > 20 && !/[.!?]$/.test(cleaned)) {
        cleaned += '.';
    }
    
    return cleaned;
}

/**
 * Optimizes an entire ResumeData object before ATS export or PDF generation.
 * Removes empty fields, standardizes formats, and normalizes skill names.
 *
 * @param {Object} resumeData 
 * @returns {Object} Optimized resume object
 */
export function optimizeForAts(resumeData) {
    if (!resumeData) return {};

    const copy = JSON.parse(JSON.stringify(resumeData));

    // 1. Clean Personal Info
    copy.name = cleanText(copy.name);
    copy.title = cleanText(copy.title);
    copy.phone = cleanText(copy.phone);
    copy.email = cleanText(copy.email).toLowerCase();
    copy.linkedin = cleanText(copy.linkedin);
    copy.github = cleanText(copy.github);
    copy.portfolio = cleanText(copy.portfolio);
    copy.summary = cleanText(copy.summary);

    // 2. Clean and Group Skills into Compact Horizontal Category Rows
    if (Array.isArray(copy.skills) && copy.skills.length > 0) {
        copy.skills = groupSkillsIntoCategories(copy.skills);
    }

    // 3. Clean Experience
    if (Array.isArray(copy.experience)) {
        copy.experience = copy.experience
            .filter(exp => exp.company || exp.role)
            .map(exp => ({
                company: cleanText(exp.company),
                role: cleanText(exp.role),
                dates: cleanText(exp.dates),
                location: cleanText(exp.location),
                bullets: (exp.bullets || [])
                    .map(cleanBulletPoint)
                    .filter(b => b.length > 5)
            }));
    }

    // 4. Clean Projects
    if (Array.isArray(copy.projects)) {
        copy.projects = copy.projects
            .filter(proj => proj.name)
            .map(proj => ({
                name: cleanText(proj.name),
                description: cleanText(proj.description),
                dates: cleanText(proj.dates),
                tech: cleanText(proj.tech),
                bullets: (proj.bullets || [])
                    .map(cleanBulletPoint)
                    .filter(b => b.length > 5),
                sourceUrl: cleanText(proj.sourceUrl),
                demoUrl: cleanText(proj.demoUrl)
            }));
    }

    // 5. Clean Education
    if (Array.isArray(copy.education)) {
        copy.education = copy.education
            .filter(edu => edu.degree || edu.institution)
            .map(edu => ({
                institution: cleanText(edu.institution),
                degree: cleanText(edu.degree),
                dates: cleanText(edu.dates),
                gpa: cleanText(edu.gpa)
            }));
    }

    // 6. Clean Certifications & Achievements
    if (Array.isArray(copy.certifications)) {
        copy.certifications = copy.certifications
            .map(cleanText)
            .filter(c => c.length > 2);
    }

    if (Array.isArray(copy.achievements)) {
        copy.achievements = copy.achievements
            .map(cleanText)
            .filter(a => a.length > 2);
    }

    return copy;
}

export default optimizeForAts;
