import jsPDF from 'jspdf';
import { calculateSmartLayout } from '../../utils/smartLayout';

/**
 * Renders the Microsoft Corporate Resume template.
 * Professional Calibri-style typography, navy section headers, balanced enterprise layout.
 */
export function renderMicrosoftTemplate(resumeData, pdfDoc = null) {
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
        doc.setTextColor(0, 120, 212); // Microsoft Corporate Blue
        doc.text(title.toUpperCase(), margin, y);

        y += 4;
        doc.setLineWidth(1);
        doc.setDrawColor(0, 120, 212);
        doc.line(margin, y, margin + contentWidth, y);
        y += 11;
    };

    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(nameSize);
    doc.setTextColor(0, 120, 212);
    doc.text(resumeData.name || 'Candidate Name', margin, y);
    y += nameSize * 0.85;

    if (resumeData.title) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize + 1);
        doc.setTextColor(50, 49, 48);
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
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize - 0.5);
        doc.setTextColor(96, 94, 92);
        doc.text(contacts.join('   |   '), margin, y);
        y += fontSize * 1.1;
    }

    y += 10;

    // --- SUMMARY ---
    if (resumeData.summary) {
        drawSectionHeader('PROFESSIONAL SUMMARY');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(50, 49, 48);

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

        resumeData.skills.forEach(skillItem => {
            checkNewPage(fontSize * lineHeight);
            const str = String(skillItem || '').trim();
            const colonIdx = str.indexOf(':');

            if (colonIdx > 0) {
                const category = str.slice(0, colonIdx).trim() + ': ';
                const items = str.slice(colonIdx + 1).trim();

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(fontSize);
                doc.setTextColor(0, 120, 212); // Microsoft Corporate Blue
                const catWidth = doc.getTextWidth(category);
                doc.text(category, margin, y);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(50, 49, 48);
                const splitItems = doc.splitTextToSize(items, contentWidth - catWidth);
                doc.text(splitItems[0] || '', margin + catWidth, y);
                y += fontSize * lineHeight;

                for (let i = 1; i < splitItems.length; i++) {
                    checkNewPage(fontSize * lineHeight);
                    doc.text(splitItems[i], margin + catWidth, y);
                    y += fontSize * lineHeight;
                }
            } else {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(50, 49, 48);
                const split = doc.splitTextToSize(str, contentWidth);
                split.forEach(line => {
                    checkNewPage(fontSize * lineHeight);
                    doc.text(line, margin, y);
                    y += fontSize * lineHeight;
                });
            }
        });
        y += sectionGap;
    }

    // --- PROJECTS ---
    if (resumeData.projects && resumeData.projects.length > 0) {
        drawSectionHeader('PROJECTS');

        resumeData.projects.forEach(proj => {
            checkNewPage(28);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(32, 31, 30);
            doc.text(proj.name || '', margin, y);

            if (proj.tech) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(96, 94, 92);
                doc.text(proj.tech, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.15;

            if (proj.bullets && proj.bullets.length > 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(50, 49, 48);

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
        drawSectionHeader('WORK EXPERIENCE');

        resumeData.experience.forEach(exp => {
            checkNewPage(32);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(32, 31, 30);
            doc.text(exp.role || '', margin, y);

            if (exp.dates) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(0, 120, 212);
                doc.text(exp.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.15;

            if (exp.company) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(96, 94, 92);
                doc.text(exp.company + (exp.location ? ` — ${exp.location}` : ''), margin, y);
                y += fontSize * 1.15;
            }

            if (exp.bullets && exp.bullets.length > 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(50, 49, 48);

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
        drawSectionHeader('ACHIEVEMENTS');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(50, 49, 48);

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
        drawSectionHeader('CERTIFICATIONS');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(50, 49, 48);

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
        drawSectionHeader('EDUCATION');

        resumeData.education.forEach(edu => {
            checkNewPage(22);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize + 0.5);
            doc.setTextColor(32, 31, 30);
            doc.text(edu.degree || '', margin, y);

            if (edu.dates) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize - 0.5);
                doc.setTextColor(96, 94, 92);
                doc.text(edu.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.15;

            if (edu.institution) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(96, 94, 92);
                doc.text(edu.institution, margin, y);
                y += fontSize * 1.15;
            }

            y += itemGap;
        });
        y += sectionGap;
    }

    doc.setProperties({
        title: `${resumeData.name || 'Candidate'} - Microsoft Style Resume`,
        subject: 'Microsoft Corporate Resume',
        author: resumeData.name || 'Candidate',
        keywords: 'Microsoft, Corporate Resume, Software Engineer, ATS, Prepnex AI',
        creator: 'Prepnex AI'
    });

    return doc;
}

export default renderMicrosoftTemplate;
