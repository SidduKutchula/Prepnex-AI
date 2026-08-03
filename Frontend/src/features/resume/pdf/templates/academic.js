import jsPDF from 'jspdf';
import { calculateSmartLayout } from '../../utils/smartLayout';

/**
 * Renders the Academic & Research Resume template.
 * Classical serif typography, publication/project priority, elegant academic spacing.
 */
export function renderAcademicTemplate(resumeData, pdfDoc = null) {
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

    let y = margin + 5;

    const checkNewPage = (needed = 20) => {
        if (y + needed > pageHeight - margin) {
            doc.addPage();
            y = margin + 10;
        }
    };

    const drawSectionHeader = (title) => {
        checkNewPage(26);
        doc.setFont('times', 'bold');
        doc.setFontSize(headingSize);
        doc.setTextColor(30, 41, 59);
        doc.text(title.toUpperCase(), margin, y);

        y += 3;
        doc.setLineWidth(1);
        doc.setDrawColor(30, 41, 59);
        doc.line(margin, y, margin + contentWidth, y);
        y += 11;
    };

    // --- HEADER ---
    doc.setFont('times', 'bold');
    doc.setFontSize(nameSize);
    doc.setTextColor(15, 23, 42);
    doc.text(resumeData.name || 'Candidate Name', margin, y);
    y += nameSize * 0.85;

    if (resumeData.title) {
        doc.setFont('times', 'italic');
        doc.setFontSize(fontSize + 1);
        doc.setTextColor(71, 85, 105);
        doc.text(resumeData.title, margin, y);
        y += (fontSize + 1) * 1.2;
    }

    const contacts = [
        resumeData.email,
        resumeData.phone,
        resumeData.linkedin ? 'LinkedIn' : null,
        resumeData.github ? 'GitHub' : null,
        resumeData.portfolio ? 'Portfolio' : null
    ].filter(Boolean);

    if (contacts.length > 0) {
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize - 0.5);
        doc.setTextColor(100, 116, 139);
        doc.text(contacts.join('   •   '), margin, y);
        y += fontSize * 1.1;
    }

    y += 10;

    // --- SUMMARY ---
    if (resumeData.summary) {
        drawSectionHeader('Research & Professional Overview');
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(51, 65, 85);

        const splitSummary = doc.splitTextToSize(resumeData.summary, contentWidth);
        splitSummary.forEach(line => {
            checkNewPage(fontSize * lineHeight);
            doc.text(line, margin, y);
            y += fontSize * lineHeight;
        });
        y += sectionGap;
    }

    // --- SKILLS ---
    if (resumeData.skills && resumeData.skills.length > 0) {
        drawSectionHeader('Skills & Competencies');
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(51, 65, 85);

        const skillsStr = resumeData.skills.join('  •  ');
        const splitSkills = doc.splitTextToSize(skillsStr, contentWidth);
        splitSkills.forEach(line => {
            checkNewPage(fontSize * lineHeight);
            doc.text(line, margin, y);
            y += fontSize * lineHeight;
        });
        y += sectionGap;
    }

    // --- PROJECTS ---
    if (resumeData.projects && resumeData.projects.length > 0) {
        drawSectionHeader('Projects & Publications');

        resumeData.projects.forEach(proj => {
            checkNewPage(28);

            doc.setFont('times', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(15, 23, 42);
            doc.text(proj.name || '', margin, y);

            if (proj.tech) {
                doc.setFont('times', 'italic');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(100, 116, 139);
                doc.text(proj.tech, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.2;

            if (proj.bullets && proj.bullets.length > 0) {
                doc.setFont('times', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(51, 65, 85);

                proj.bullets.forEach(bullet => {
                    const splitBullet = doc.splitTextToSize(`•  ${bullet}`, contentWidth - 10);
                    splitBullet.forEach((bLine, i) => {
                        checkNewPage(fontSize * lineHeight);
                        const xOffset = i === 0 ? margin : margin + 10;
                        doc.text(bLine, xOffset, y);
                        y += fontSize * lineHeight;
                    });
                });
            }

            y += itemGap;
        });

        y += sectionGap;
    }

    // --- EXPERIENCE ---
    if (resumeData.experience && resumeData.experience.length > 0) {
        drawSectionHeader('Academic & Professional Experience');

        resumeData.experience.forEach(exp => {
            checkNewPage(32);

            doc.setFont('times', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(15, 23, 42);
            doc.text(exp.role || '', margin, y);

            if (exp.dates) {
                doc.setFont('times', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(100, 116, 139);
                doc.text(exp.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.2;

            if (exp.company) {
                doc.setFont('times', 'italic');
                doc.setFontSize(fontSize);
                doc.setTextColor(71, 85, 105);
                doc.text(exp.company + (exp.location ? `, ${exp.location}` : ''), margin, y);
                y += fontSize * 1.2;
            }

            if (exp.bullets && exp.bullets.length > 0) {
                doc.setFont('times', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(51, 65, 85);

                exp.bullets.forEach(bullet => {
                    const splitBullet = doc.splitTextToSize(`•  ${bullet}`, contentWidth - 10);
                    splitBullet.forEach((bLine, i) => {
                        checkNewPage(fontSize * lineHeight);
                        const xOffset = i === 0 ? margin : margin + 10;
                        doc.text(bLine, xOffset, y);
                        y += fontSize * lineHeight;
                    });
                });
            }

            y += itemGap;
        });

        y += sectionGap;
    }

    // --- ACHIEVEMENTS ---
    if (resumeData.achievements && resumeData.achievements.length > 0) {
        drawSectionHeader('Honors & Achievements');
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(51, 65, 85);

        resumeData.achievements.forEach(ach => {
            const splitAch = doc.splitTextToSize(`•  ${ach}`, contentWidth - 10);
            splitAch.forEach((aLine, i) => {
                checkNewPage(fontSize * lineHeight);
                const xOffset = i === 0 ? margin : margin + 10;
                doc.text(aLine, xOffset, y);
                y += fontSize * lineHeight;
            });
        });
        y += sectionGap;
    }

    // --- CERTIFICATIONS ---
    if (resumeData.certifications && resumeData.certifications.length > 0) {
        drawSectionHeader('Certifications & Licenses');
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(51, 65, 85);

        resumeData.certifications.forEach(cert => {
            const splitCert = doc.splitTextToSize(`•  ${cert}`, contentWidth - 10);
            splitCert.forEach((cLine, i) => {
                checkNewPage(fontSize * lineHeight);
                const xOffset = i === 0 ? margin : margin + 10;
                doc.text(cLine, xOffset, y);
                y += fontSize * lineHeight;
            });
        });
        y += sectionGap;
    }

    // --- EDUCATION ---
    if (resumeData.education && resumeData.education.length > 0) {
        drawSectionHeader('Education & Credentials');

        resumeData.education.forEach(edu => {
            checkNewPage(22);

            doc.setFont('times', 'bold');
            doc.setFontSize(fontSize + 1);
            doc.setTextColor(15, 23, 42);
            doc.text(edu.degree || '', margin, y);

            if (edu.dates) {
                doc.setFont('times', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(100, 116, 139);
                doc.text(edu.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.2;

            if (edu.institution) {
                doc.setFont('times', 'italic');
                doc.setFontSize(fontSize);
                doc.setTextColor(71, 85, 105);
                doc.text(edu.institution + (edu.gpa ? ` (GPA: ${edu.gpa})` : ''), margin, y);
                y += fontSize * 1.2;
            }

            y += itemGap;
        });

        y += sectionGap;
    }

    doc.setProperties({
        title: `${resumeData.name || 'Candidate'} - Academic Resume`,
        subject: 'Academic & Research Resume',
        author: resumeData.name || 'Candidate',
        keywords: 'Academic, Research, Publications, Resume, Prepnex AI',
        creator: 'Prepnex AI'
    });

    return doc;
}

export default renderAcademicTemplate;
