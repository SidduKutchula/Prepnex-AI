import jsPDF from 'jspdf';
import { calculateSmartLayout } from '../../utils/smartLayout';
import { groupSkillsIntoCategories } from '../../utils/atsOptimizer';

/**
 * Renders the Classic ATS Resume template onto a jsPDF document.
 * Single/Double column, clean rules, high ATS parsing accuracy.
 *
 * @param {Object} resumeData - Cleaned resume data
 * @param {jsPDF} [pdfDoc] - Optional existing jsPDF instance
 * @returns {jsPDF} The populated jsPDF instance
 */
export function renderClassicTemplate(resumeData, pdfDoc = null) {
    const doc = pdfDoc || new jsPDF({ unit: 'pt', format: 'a4' });
    const layout = calculateSmartLayout(resumeData);

    const {
        margin,
        fontSize,
        headingSize,
        nameSize,
        lineHeight,
        sectionGap,
        itemGap
    } = layout;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);

    let y = margin + 8;

    // Helper: Add page if near bottom
    const checkNewPage = (needed = 20) => {
        if (y + needed > pageHeight - margin) {
            doc.addPage();
            y = margin + 8;
        }
    };

    // Helper: Draw Section Header with horizontal line
    const drawSectionHeader = (title) => {
        checkNewPage(30);
        doc.setFont('times', 'bold');
        doc.setFontSize(headingSize);
        doc.setTextColor(15, 23, 42); // Slate dark
        doc.text(title.toUpperCase(), margin, y);

        y += 4;
        doc.setLineWidth(0.75);
        doc.setDrawColor(203, 213, 225); // Slate light line
        doc.line(margin, y, margin + contentWidth, y);
        y += 12;
    };

    const candidateName = (resumeData.name && resumeData.name.trim() !== '')
        ? resumeData.name
        : 'Candidate Name';

    // --- 1. HEADER (CENTERED NAME & CONTACT) ---
    doc.setFont('times', 'bold');
    doc.setFontSize(nameSize + 2);
    doc.setTextColor(0, 0, 0);
    doc.text(candidateName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += (nameSize + 2) * 0.85;

    if (resumeData.title) {
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize + 1.5);
        doc.setTextColor(51, 65, 85);
        doc.text(resumeData.title, pageWidth / 2, y, { align: 'center' });
        y += (fontSize + 1.5) * 1.2;
    }

    // Contact bar: +91 6305198912 — Siddukuchula62@gmail.com — linkedin.com/in/siddu-kutchula — github.com/SidduKutchula
    const contacts = [
        resumeData.phone,
        resumeData.email,
        resumeData.linkedin ? (resumeData.linkedin.replace(/^https?:\/\//, '')) : null,
        resumeData.github ? (resumeData.github.replace(/^https?:\/\//, '')) : null
    ].filter(Boolean);

    if (contacts.length > 0) {
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize - 0.5);
        doc.setTextColor(37, 99, 235); // Blue links
        const contactStr = contacts.join('  —  ');
        doc.text(contactStr, pageWidth / 2, y, { align: 'center' });
        y += fontSize * 1.2;
    }

    y += 10;

    // --- 2. PROFESSIONAL SUMMARY ---
    if (resumeData.summary) {
        drawSectionHeader('PROFESSIONAL SUMMARY');
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(30, 41, 59);

        const splitSummary = doc.splitTextToSize(resumeData.summary, contentWidth);
        splitSummary.forEach(line => {
            checkNewPage(fontSize * lineHeight);
            doc.text(line, margin, y);
            y += fontSize * lineHeight;
        });
        y += sectionGap;
    }

    // --- 3. TECHNICAL PROFICIENCIES ---
    const formattedSkills = groupSkillsIntoCategories(resumeData.skills || []);
    if (formattedSkills && formattedSkills.length > 0) {
        drawSectionHeader('TECHNICAL PROFICIENCIES');
        doc.setFontSize(fontSize);

        formattedSkills.forEach(skillItem => {
            checkNewPage(fontSize * lineHeight);
            const parts = typeof skillItem === 'string' ? skillItem.split(':') : [String(skillItem || '')];
            const category = parts.length > 1 ? parts[0].trim() : 'Skills';
            const value = parts.length > 1 ? parts.slice(1).join(':').trim() : (skillItem || '');

            doc.setFont('times', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(category, margin, y);

            doc.setFont('times', 'normal');
            doc.setTextColor(30, 41, 59);
            const splitVal = doc.splitTextToSize(String(value || ''), contentWidth - 140);
            doc.text(splitVal[0] || '', margin + 140, y);
            y += fontSize * lineHeight;

            for (let i = 1; i < splitVal.length; i++) {
                checkNewPage(fontSize * lineHeight);
                doc.text(splitVal[i], margin + 140, y);
                y += fontSize * lineHeight;
            }
        });
        y += sectionGap;
    }


    // --- 4. PROJECTS ---
    if (resumeData.projects && resumeData.projects.length > 0) {
        drawSectionHeader('PROJECTS');

        resumeData.projects.forEach(proj => {
            checkNewPage(35);

            // Title left, dates right
            doc.setFont('times', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(0, 0, 0);
            doc.text(proj.name || '', margin, y);

            if (proj.dates) {
                doc.setFont('times', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(71, 85, 105);
                doc.text(proj.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.15;

            // Tech stack left, Source Code — Live Demo right
            if (proj.tech) {
                doc.setFont('times', 'italic');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(51, 65, 85);
                doc.text(proj.tech, margin, y);
            }

            doc.setFont('times', 'normal');
            doc.setFontSize(fontSize - 1);
            doc.setTextColor(37, 99, 235);
            doc.text('Source Code  —  Live Demo', margin + contentWidth, y, { align: 'right' });

            y += fontSize * 1.2;

            if (proj.bullets && proj.bullets.length > 0) {
                doc.setFont('times', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(0, 0, 0);

                proj.bullets.forEach(bullet => {
                    const splitBullet = doc.splitTextToSize(`•  ${bullet}`, contentWidth - 12);
                    splitBullet.forEach((bLine, i) => {
                        checkNewPage(fontSize * lineHeight);
                        const xOffset = i === 0 ? margin : margin + 12;
                        doc.text(bLine, xOffset, y);
                        y += fontSize * lineHeight;
                    });
                });
            }

            y += itemGap;
        });

        y += sectionGap;
    }

    // --- 5. WORK EXPERIENCE ---
    if (resumeData.experience && resumeData.experience.length > 0) {
        drawSectionHeader('WORK EXPERIENCE');

        resumeData.experience.forEach(exp => {
            checkNewPage(35);

            doc.setFont('times', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(0, 0, 0);
            const roleCompany = (exp.role || '') + (exp.company ? (exp.role ? '  –  ' : '') + exp.company : '');
            doc.text(roleCompany, margin, y);

            if (exp.dates) {
                doc.setFont('times', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(71, 85, 105);
                doc.text(exp.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.2;

            if (exp.bullets && exp.bullets.length > 0) {
                doc.setFont('times', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(0, 0, 0);

                exp.bullets.forEach(bullet => {
                    const splitBullet = doc.splitTextToSize(`•  ${bullet}`, contentWidth - 12);
                    splitBullet.forEach((bLine, i) => {
                        checkNewPage(fontSize * lineHeight);
                        const xOffset = i === 0 ? margin : margin + 12;
                        doc.text(bLine, xOffset, y);
                        y += fontSize * lineHeight;
                    });
                });
            }

            y += itemGap;
        });

        y += sectionGap;
    }

    // --- 6. ACHIEVEMENTS ---
    if (resumeData.achievements && resumeData.achievements.length > 0) {
        drawSectionHeader('ACHIEVEMENTS');
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(0, 0, 0);

        resumeData.achievements.forEach(item => {
            const splitItem = doc.splitTextToSize(`•  ${item}`, contentWidth - 12);
            splitItem.forEach((line, i) => {
                checkNewPage(fontSize * lineHeight);
                const xOffset = i === 0 ? margin : margin + 12;
                doc.text(line, xOffset, y);
                y += fontSize * lineHeight;
            });
        });
        y += sectionGap;
    }

    // --- 7. CERTIFICATIONS ---
    if (resumeData.certifications && resumeData.certifications.length > 0) {
        drawSectionHeader('CERTIFICATIONS');
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(0, 0, 0);

        resumeData.certifications.forEach(cert => {
            const splitCert = doc.splitTextToSize(`•  ${cert}`, contentWidth - 12);
            splitCert.forEach((line, i) => {
                checkNewPage(fontSize * lineHeight);
                const xOffset = i === 0 ? margin : margin + 12;
                doc.text(line, xOffset, y);
                y += fontSize * lineHeight;
            });
        });
        y += sectionGap;
    }

    // --- 8. EDUCATION ---
    if (resumeData.education && resumeData.education.length > 0) {
        drawSectionHeader('EDUCATION');

        resumeData.education.forEach(edu => {
            checkNewPage(25);

            let degreeText = edu.degree || '';
            degreeText = degreeText.replace(/20\d{2}\s*[\u2013\u2014-]\s*20\d{2}\s*(\(Expected\))?/gi, '').trim();
            const datesText = edu.dates || '';

            // Top line: Degree (left) & Dates (right)
            doc.setFont('times', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(0, 0, 0);

            const splitDegree = doc.splitTextToSize(degreeText, contentWidth - 110);
            doc.text(splitDegree[0] || '', margin, y);

            if (datesText) {
                doc.setFont('times', 'bold');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(71, 85, 105);
                doc.text(datesText, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * lineHeight;

            for (let i = 1; i < splitDegree.length; i++) {
                checkNewPage(fontSize * lineHeight);
                doc.setFont('times', 'bold');
                doc.setFontSize(fontSize + 0.5);
                doc.setTextColor(0, 0, 0);
                doc.text(splitDegree[i], margin, y);
                y += fontSize * lineHeight;
            }

            // Second line: Institution (left) & GPA (right)
            let instText = edu.institution || '';
            let gpaText = edu.gpa || '';

            if (instText.includes('CGPA:')) {
                const parts = instText.split('CGPA:');
                instText = parts[0].replace(/[|–—]/g, '').trim();
                gpaText = 'CGPA:' + parts[1].trim();
            }

            doc.setFont('times', 'italic');
            doc.setFontSize(fontSize);
            doc.setTextColor(51, 65, 85);
            
            const splitInst = doc.splitTextToSize(instText, contentWidth - 110);
            doc.text(splitInst[0] || '', margin, y);

            if (gpaText) {
                doc.setFont('times', 'bold');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(0, 0, 0);
                doc.text(gpaText, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * lineHeight;

            for (let i = 1; i < splitInst.length; i++) {
                checkNewPage(fontSize * lineHeight);
                doc.setFont('times', 'italic');
                doc.setFontSize(fontSize);
                doc.setTextColor(51, 65, 85);
                doc.text(splitInst[i], margin, y);
                y += fontSize * lineHeight;
            }

            y += itemGap;
        });
    }

    // Set Document Properties (Metadata)
    doc.setProperties({
        title: `${resumeData.name || 'Candidate'} - Resume`,
        subject: 'Professional ATS Resume',
        author: resumeData.name || 'Candidate',
        keywords: 'Resume, ATS, Software Engineer, Prepnex AI',
        creator: 'Prepnex AI'
    });

    return doc;
}

export default renderClassicTemplate;
