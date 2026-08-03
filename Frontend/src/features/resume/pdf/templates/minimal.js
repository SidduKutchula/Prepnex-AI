import jsPDF from 'jspdf';
import { calculateSmartLayout } from '../../utils/smartLayout';

/**
 * Renders the Minimalist Clean Resume template.
 * Focused on maximum whitespace, light divider lines, and elegant typography.
 */
export function renderMinimalTemplate(resumeData, pdfDoc = null) {
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

    let y = margin + 10;

    const checkNewPage = (needed = 20) => {
        if (y + needed > pageHeight - margin) {
            doc.addPage();
            y = margin + 10;
        }
    };

    const drawSectionHeader = (title) => {
        checkNewPage(25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(headingSize - 1);
        doc.setTextColor(15, 23, 42); // Charcoal dark
        doc.text(title.toUpperCase(), margin, y);

        y += 4;
        doc.setLineWidth(0.5);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, margin + contentWidth, y);
        y += 10;
    };

    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(nameSize - 2);
    doc.setTextColor(15, 23, 42);
    doc.text(resumeData.name || 'Candidate Name', margin, y);
    y += (nameSize - 2) * 0.9;

    if (resumeData.title) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(100, 116, 139);
        doc.text(resumeData.title, margin, y);
        y += fontSize * 1.2;
    }

    // Contact info
    const contacts = [
        resumeData.email,
        resumeData.phone,
        resumeData.linkedin ? 'LinkedIn' : null,
        resumeData.github ? 'GitHub' : null,
        resumeData.portfolio ? 'Portfolio' : null
    ].filter(Boolean);

    if (contacts.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize - 1);
        doc.setTextColor(148, 163, 184);
        doc.text(contacts.join('   /   '), margin, y);
        y += fontSize * 1.1;
    }

    y += 10;

    // --- SUMMARY ---
    if (resumeData.summary) {
        drawSectionHeader('PROFESSIONAL SUMMARY');
        doc.setFont('helvetica', 'normal');
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
        drawSectionHeader('TECHNICAL PROFICIENCIES');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(51, 65, 85);

        const skillsStr = resumeData.skills.join(', ');
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
        drawSectionHeader('PROJECTS');

        resumeData.projects.forEach(proj => {
            checkNewPage(25);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize);
            doc.setTextColor(15, 23, 42);
            doc.text(proj.name || '', margin, y);

            if (proj.tech) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 1);
                doc.setTextColor(148, 163, 184);
                doc.text(proj.tech, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.1;

            if (proj.bullets && proj.bullets.length > 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(51, 65, 85);

                proj.bullets.forEach(bullet => {
                    const splitBullet = doc.splitTextToSize(`-  ${bullet}`, contentWidth - 10);
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
        drawSectionHeader('WORK EXPERIENCE');

        resumeData.experience.forEach(exp => {
            checkNewPage(30);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize);
            doc.setTextColor(15, 23, 42);
            doc.text(exp.role || '', margin, y);

            if (exp.dates) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 1);
                doc.setTextColor(148, 163, 184);
                doc.text(exp.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.1;

            if (exp.company) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(100, 116, 139);
                doc.text(exp.company + (exp.location ? `, ${exp.location}` : ''), margin, y);
                y += fontSize * 1.1;
            }

            if (exp.bullets && exp.bullets.length > 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(51, 65, 85);

                exp.bullets.forEach(bullet => {
                    const splitBullet = doc.splitTextToSize(`-  ${bullet}`, contentWidth - 10);
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
        drawSectionHeader('ACHIEVEMENTS');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize - 0.5);
        doc.setTextColor(51, 65, 85);

        resumeData.achievements.forEach(ach => {
            const splitAch = doc.splitTextToSize(`-  ${ach}`, contentWidth - 10);
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
        drawSectionHeader('CERTIFICATIONS');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize - 0.5);
        doc.setTextColor(51, 65, 85);

        resumeData.certifications.forEach(cert => {
            const splitCert = doc.splitTextToSize(`-  ${cert}`, contentWidth - 10);
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
        drawSectionHeader('EDUCATION');

        resumeData.education.forEach(edu => {
            checkNewPage(20);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize);
            doc.setTextColor(15, 23, 42);
            doc.text(edu.degree || '', margin, y);

            if (edu.dates) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 1);
                doc.setTextColor(148, 163, 184);
                doc.text(edu.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.1;

            if (edu.institution) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(100, 116, 139);
                doc.text(edu.institution, margin, y);
                y += fontSize * 1.1;
            }

            y += itemGap;
        });
        y += sectionGap;
    }

    doc.setProperties({
        title: `${resumeData.name || 'Candidate'} - Minimal Resume`,
        subject: 'Minimalist Resume',
        author: resumeData.name || 'Candidate',
        keywords: 'Resume, ATS, Prepnex AI',
        creator: 'Prepnex AI'
    });

    return doc;
}

export default renderMinimalTemplate;
