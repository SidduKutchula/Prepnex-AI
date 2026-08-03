import jsPDF from 'jspdf';
import { calculateSmartLayout } from '../../utils/smartLayout';

/**
 * Renders the Google Style ATS Resume template.
 * Hyper-compact, 1-page optimized, Arial font, single-column, standard tech-first hierarchy.
 */
export function renderGoogleTemplate(resumeData, pdfDoc = null) {
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
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(headingSize);
        doc.setTextColor(32, 33, 36); // Google Dark Gray
        doc.text(title.toUpperCase(), margin, y);

        y += 3;
        doc.setLineWidth(0.75);
        doc.setDrawColor(218, 220, 224);
        doc.line(margin, y, margin + contentWidth, y);
        y += 10;
    };

    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(nameSize);
    doc.setTextColor(32, 33, 36);
    doc.text(resumeData.name || 'Candidate Name', margin, y);
    y += nameSize * 0.85;

    if (resumeData.title) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize + 1);
        doc.setTextColor(95, 99, 104);
        doc.text(resumeData.title, margin, y);
        y += (fontSize + 1) * 1.2;
    }

    // Contact line
    const contacts = [
        resumeData.email,
        resumeData.phone,
        resumeData.linkedin ? 'LinkedIn' : null,
        resumeData.github ? 'GitHub' : null,
        resumeData.portfolio ? 'Portfolio' : null
    ].filter(Boolean);

    if (contacts.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize - 0.5);
        doc.setTextColor(95, 99, 104);
        doc.text(contacts.join('  |  '), margin, y);
        y += fontSize * 1.1;
    }

    y += 10;

    // --- SUMMARY ---
    if (resumeData.summary) {
        drawSectionHeader('Summary');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(60, 64, 67);

        const splitSummary = doc.splitTextToSize(resumeData.summary, contentWidth);
        splitSummary.forEach(line => {
            checkNewPage(fontSize * lineHeight);
            doc.text(line, margin, y);
            y += fontSize * lineHeight;
        });
        y += sectionGap;
    }

    // --- TECHNICAL SKILLS ---
    if (resumeData.skills && resumeData.skills.length > 0) {
        drawSectionHeader('Skills & Technologies');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(60, 64, 67);

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
        drawSectionHeader('Projects');

        resumeData.projects.forEach(proj => {
            checkNewPage(28);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(32, 33, 36);
            doc.text(proj.name || '', margin, y);

            if (proj.tech) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(95, 99, 104);
                doc.text(proj.tech, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.15;

            if (proj.bullets && proj.bullets.length > 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(60, 64, 67);

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
        drawSectionHeader('Experience');

        resumeData.experience.forEach(exp => {
            checkNewPage(32);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(32, 33, 36);
            doc.text(exp.role || '', margin, y);

            if (exp.dates) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(95, 99, 104);
                doc.text(exp.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.15;

            if (exp.company) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(95, 99, 104);
                doc.text(exp.company + (exp.location ? ` • ${exp.location}` : ''), margin, y);
                y += fontSize * 1.15;
            }

            if (exp.bullets && exp.bullets.length > 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(60, 64, 67);

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
        drawSectionHeader('Achievements');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(60, 64, 67);

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
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(60, 64, 67);

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
        drawSectionHeader('Education');

        resumeData.education.forEach(edu => {
            checkNewPage(22);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(32, 33, 36);
            doc.text(edu.degree || '', margin, y);

            if (edu.dates) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(95, 99, 104);
                doc.text(edu.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.15;

            if (edu.institution) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(95, 99, 104);
                doc.text(edu.institution, margin, y);
                y += fontSize * 1.15;
            }

            y += itemGap;
        });
        y += sectionGap;
    }

    doc.setProperties({
        title: `${resumeData.name || 'Candidate'} - Google Style Resume`,
        subject: 'Google Style ATS Resume',
        author: resumeData.name || 'Candidate',
        keywords: 'Google, Tech Resume, Software Engineer, ATS, Prepnex AI',
        creator: 'Prepnex AI'
    });

    return doc;
}

export default renderGoogleTemplate;
