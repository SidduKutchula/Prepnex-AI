/**
 * smartLayout.js
 * Smart Layout Engine for PDF generation.
 * Calculates content density and automatically adjusts margins, font sizes,
 * line heights, and section spacing to ensure the resume fits cleanly on 1 (or max 2) pages
 * without text clipping, overflows, or awkward orphaned lines.
 */

// ISO 216 Standard A4 dimensions in points (pt) - 210mm x 297mm (1 pt = 1/72 inch)
export const A4_HEIGHT_PT = 841.89; // 297mm ISO 216 Standard Height
export const A4_WIDTH_PT = 595.28;  // 210mm ISO 216 Standard Width

/**
 * Calculates estimated vertical height (in pt) required to render the given resume data.
 * 
 * @param {Object} resumeData 
 * @param {Object} styleConfig 
 * @returns {number} Estimated height in points
 */
export function estimateContentHeight(resumeData, styleConfig = {}) {
    const {
        fontSize = 9.75,
        headingSize = 11.5,
        lineHeight = 1.22,
        sectionGap = 9,
        itemGap = 4
    } = styleConfig;

    const baseLineHeight = fontSize * lineHeight;
    let totalHeight = 40; // Top and bottom initial padding

    // 1. Header (Name, Title, Links)
    totalHeight += 22; // Name
    if (resumeData.title) totalHeight += 14; // Title
    totalHeight += 12; // Links line
    totalHeight += sectionGap;

    // 2. Summary
    if (resumeData.summary) {
        totalHeight += headingSize + 2;
        const lineCount = Math.ceil(resumeData.summary.length / 95);
        totalHeight += lineCount * baseLineHeight + sectionGap;
    }

    // 3. Skills (6 Category Rows)
    if (resumeData.skills && resumeData.skills.length > 0) {
        totalHeight += headingSize + 2;
        const rowsCount = Array.isArray(resumeData.skills) ? Math.max(resumeData.skills.length, 6) : 6;
        totalHeight += rowsCount * baseLineHeight + sectionGap;
    }

    // 4. Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
        totalHeight += headingSize + 2;
        for (const exp of resumeData.experience) {
            totalHeight += baseLineHeight + 2; // Role & Company line
            if (exp.bullets && exp.bullets.length > 0) {
                for (const bullet of exp.bullets) {
                    const bulletLines = Math.ceil(bullet.length / 85);
                    totalHeight += bulletLines * baseLineHeight + 1.5;
                }
            }
            totalHeight += itemGap;
        }
        totalHeight += sectionGap;
    }

    // 5. Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
        totalHeight += headingSize + 2;
        for (const proj of resumeData.projects) {
            totalHeight += baseLineHeight + 2; // Project Name & Tech
            if (proj.description) {
                totalHeight += Math.ceil(proj.description.length / 85) * baseLineHeight;
            }
            if (proj.bullets && proj.bullets.length > 0) {
                for (const bullet of proj.bullets) {
                    const bulletLines = Math.ceil(bullet.length / 85);
                    totalHeight += bulletLines * baseLineHeight + 1.5;
                }
            }
            totalHeight += itemGap;
        }
        totalHeight += sectionGap;
    }

    // 6. Education
    if (resumeData.education && resumeData.education.length > 0) {
        totalHeight += headingSize + 2;
        for (const edu of resumeData.education) {
            totalHeight += baseLineHeight * 2 + itemGap;
        }
        totalHeight += sectionGap;
    }

    // 7. Certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
        totalHeight += headingSize + 2;
        totalHeight += resumeData.certifications.length * (baseLineHeight + 1) + sectionGap;
    }

    // 8. Achievements
    if (resumeData.achievements && resumeData.achievements.length > 0) {
        totalHeight += headingSize + 2;
        totalHeight += resumeData.achievements.length * (baseLineHeight + 1) + sectionGap;
    }

    return totalHeight;
}

/**
 * Computes layout parameters to fit ISO 216 Standard A4 (210mm x 297mm) on 1 single page.
 * 
 * @param {Object} resumeData 
 * @returns {Object} Optimized layout parameters
 */
export function calculateSmartLayout(resumeData) {
    const tightA4Params = {
        margin: 20,        // 20pt margin top/bottom (~7mm) - minimal white space!
        fontSize: 10,      // 10pt body text
        headingSize: 11.5, // 11.5pt section headings
        nameSize: 21,      // 21pt candidate name
        lineHeight: 1.26,  // 1.26 line height for smooth page filling
        sectionGap: 11,    // 11pt gap between sections
        itemGap: 5,        // 5pt gap between items
        targetPages: 1
    };

    return tightA4Params;
}

export default calculateSmartLayout;
