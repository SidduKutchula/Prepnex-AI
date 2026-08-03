import jsPDF from 'jspdf';
import { calculateSmartLayout } from '../../utils/smartLayout';

/**
 * Renders the Developer Resume template.
 * Highlights Technical Stack, Monospace code styling for project links/tech tags,
 * and clear project architecture bullets.
 */
export function renderDeveloperTemplate(resumeData, pdfDoc = null) {
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
        checkNewPage(28);
        doc.setFont('courier', 'bold');
        doc.setFontSize(headingSize);
        doc.setTextColor(14, 165, 233); // Cyan / Developer Blue
        doc.text(`// ${title.toUpperCase()}`, margin, y);

        y += 4;
        doc.setLineWidth(0.75);
        doc.setDrawColor(56, 189, 248);
        doc.line(margin, y, margin + contentWidth, y);
        y += 12;
    };

    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(nameSize);
    doc.setTextColor(15, 23, 42);
    doc.text(resumeData.name || 'Developer Name', margin, y);
    y += nameSize * 0.85;

    if (resumeData.title) {
        doc.setFont('courier', 'bold');
        doc.setFontSize(fontSize + 1);
        doc.setTextColor(14, 165, 233);
        doc.text(`<${resumeData.title} />`, margin, y);
        y += (fontSize + 1) * 1.3;
    }

    // Contact line
    const contacts = [
        resumeData.email,
        resumeData.phone,
        resumeData.github ? `github: ${resumeData.github}` : null,
        resumeData.linkedin ? `linkedin: ${resumeData.linkedin}` : null,
        resumeData.portfolio ? `web: ${resumeData.portfolio}` : null
    ].filter(Boolean);

    if (contacts.length > 0) {
        doc.setFont('courier', 'normal');
        doc.setFontSize(fontSize - 1);
        doc.setTextColor(71, 85, 105);
        doc.text(contacts.join('  |  '), margin, y);
        y += fontSize * 1.2;
    }

    y += 10;

    // --- SUMMARY ---
    if (resumeData.summary) {
        drawSectionHeader('Overview');
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

    // --- TECHNICAL STACK ---
    if (resumeData.skills && resumeData.skills.length > 0) {
        drawSectionHeader('Technical Stack');
        doc.setFont('courier', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(30, 41, 59);

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
        drawSectionHeader('Projects & Open Source');

        resumeData.projects.forEach(proj => {
            checkNewPage(30);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(15, 23, 42);
            doc.text(proj.name || '', margin, y);

            if (proj.tech) {
                doc.setFont('courier', 'normal');
                doc.setFontSize(fontSize - 1);
                doc.setTextColor(14, 165, 233);
                doc.text(`[${proj.tech}]`, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.2;

            if (proj.bullets && proj.bullets.length > 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(51, 65, 85);

                proj.bullets.forEach(bullet => {
                    const splitBullet = doc.splitTextToSize(`>  ${bullet}`, contentWidth - 12);
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

    // --- EXPERIENCE ---
    if (resumeData.experience && resumeData.experience.length > 0) {
        drawSectionHeader('Experience');

        resumeData.experience.forEach(exp => {
            checkNewPage(35);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(15, 23, 42);
            doc.text(exp.role || '', margin, y);

            if (exp.dates) {
                doc.setFont('courier', 'bold');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(14, 165, 233);
                doc.text(exp.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.2;

            if (exp.company) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(fontSize);
                doc.setTextColor(71, 85, 105);
                doc.text(`@ ${exp.company}` + (exp.location ? ` (${exp.location})` : ''), margin, y);
                y += fontSize * 1.2;
            }

            if (exp.bullets && exp.bullets.length > 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(51, 65, 85);

                exp.bullets.forEach(bullet => {
                    const splitBullet = doc.splitTextToSize(`>  ${bullet}`, contentWidth - 12);
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

    // --- ACHIEVEMENTS ---
    if (resumeData.achievements && resumeData.achievements.length > 0) {
        drawSectionHeader('Achievements');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(51, 65, 85);

        resumeData.achievements.forEach(ach => {
            const splitAch = doc.splitTextToSize(`>  ${ach}`, contentWidth - 12);
            splitAch.forEach((aLine, i) => {
                checkNewPage(fontSize * lineHeight);
                const xOffset = i === 0 ? margin : margin + 12;
                doc.text(aLine, xOffset, y);
                y += fontSize * lineHeight;
            });
        });
        y += sectionGap;
    }

    // --- CERTIFICATIONS ---
    if (resumeData.certifications && resumeData.certifications.length > 0) {
        drawSectionHeader('Certifications');
        doc.setFont('courier', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(30, 41, 59);

        resumeData.certifications.forEach(cert => {
            const splitCert = doc.splitTextToSize(`>  ${cert}`, contentWidth - 12);
            splitCert.forEach((cLine, i) => {
                checkNewPage(fontSize * lineHeight);
                const xOffset = i === 0 ? margin : margin + 12;
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
            checkNewPage(25);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(15, 23, 42);
            doc.text(edu.degree || '', margin, y);

            if (edu.dates) {
                doc.setFont('courier', 'normal');
                doc.setFontSize(fontSize - 1);
                doc.setTextColor(100, 116, 139);
                doc.text(edu.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.2;

            if (edu.institution) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(71, 85, 105);
                doc.text(edu.institution, margin, y);
                y += fontSize * 1.2;
            }

            y += itemGap;
        });
        y += sectionGap;
    }

    doc.setProperties({
        title: `${resumeData.name || 'Developer'} - Technical Resume`,
        subject: 'Developer Resume',
        author: resumeData.name || 'Developer',
        keywords: 'Software Engineer, Developer, React, Node.js, ATS, Prepnex AI',
        creator: 'Prepnex AI'
    });

    return doc;
}

export default renderDeveloperTemplate;
