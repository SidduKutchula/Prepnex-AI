import jsPDF from 'jspdf';
import { calculateSmartLayout } from '../../utils/smartLayout';

/**
 * Renders the Executive / Senior Leadership Resume template.
 * Polished serif typography, double border accents, and achievement-focused hierarchy.
 */
export function renderExecutiveTemplate(resumeData, pdfDoc = null) {
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
        checkNewPage(30);
        doc.setFont('times', 'bold');
        doc.setFontSize(headingSize + 1);
        doc.setTextColor(15, 23, 42); // Navy/Black
        doc.text(title.toUpperCase(), margin, y);

        y += 4;
        doc.setLineWidth(1);
        doc.setDrawColor(15, 23, 42);
        doc.line(margin, y, margin + contentWidth, y);
        y += 12;
    };

    // --- HEADER ---
    // Centered Executive Header
    const centerX = pageWidth / 2;

    doc.setFont('times', 'bold');
    doc.setFontSize(nameSize + 2);
    doc.setTextColor(15, 23, 42);
    doc.text(resumeData.name || 'Executive Name', centerX, y, { align: 'center' });
    y += (nameSize + 2) * 0.85;

    if (resumeData.title) {
        doc.setFont('times', 'italic');
        doc.setFontSize(fontSize + 2);
        doc.setTextColor(71, 85, 105);
        doc.text(resumeData.title, centerX, y, { align: 'center' });
        y += (fontSize + 2) * 1.2;
    }

    // Contact line centered
    const contacts = [
        resumeData.email,
        resumeData.phone,
        resumeData.linkedin ? 'LinkedIn' : null,
        resumeData.portfolio ? 'Portfolio' : null
    ].filter(Boolean);

    if (contacts.length > 0) {
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize - 0.5);
        doc.setTextColor(100, 116, 139);
        doc.text(contacts.join('   ◆   '), centerX, y, { align: 'center' });
        y += fontSize * 1.2;
    }

    y += 12;

    // --- EXECUTIVE SUMMARY ---
    if (resumeData.summary) {
        drawSectionHeader('Executive Summary');
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize + 0.5);
        doc.setTextColor(30, 41, 59);

        const splitSummary = doc.splitTextToSize(resumeData.summary, contentWidth);
        splitSummary.forEach(line => {
            checkNewPage(fontSize * lineHeight);
            doc.text(line, margin, y);
            y += fontSize * lineHeight;
        });
        y += sectionGap;
    }

    // --- CORE COMPETENCIES ---
    if (resumeData.skills && resumeData.skills.length > 0) {
        drawSectionHeader('Core Competencies');
        doc.setFont('times', 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(51, 65, 85);

        const skillsStr = resumeData.skills.join('  ◆  ');
        const splitSkills = doc.splitTextToSize(skillsStr, contentWidth);
        splitSkills.forEach(line => {
            checkNewPage(fontSize * lineHeight);
            doc.text(line, margin, y);
            y += fontSize * lineHeight;
        });
        y += sectionGap;
    }

    // --- PROFESSIONAL EXPERIENCE ---
    if (resumeData.experience && resumeData.experience.length > 0) {
        drawSectionHeader('Professional Experience');

        resumeData.experience.forEach(exp => {
            checkNewPage(35);

            doc.setFont('times', 'bold');
            doc.setFontSize(fontSize + 1);
            doc.setTextColor(15, 23, 42);
            doc.text(exp.role || '', margin, y);

            if (exp.dates) {
                doc.setFont('times', 'bold');
                doc.setFontSize(fontSize);
                doc.setTextColor(15, 23, 42);
                doc.text(exp.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.2;

            if (exp.company) {
                doc.setFont('times', 'italic');
                doc.setFontSize(fontSize + 0.5);
                doc.setTextColor(71, 85, 105);
                doc.text(exp.company + (exp.location ? ` — ${exp.location}` : ''), margin, y);
                y += fontSize * 1.2;
            }

            if (exp.bullets && exp.bullets.length > 0) {
                doc.setFont('times', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(51, 65, 85);

                exp.bullets.forEach(bullet => {
                    const splitBullet = doc.splitTextToSize(`◆  ${bullet}`, contentWidth - 12);
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

    // --- KEY ACHIEVEMENTS ---
    if (resumeData.achievements && resumeData.achievements.length > 0) {
        drawSectionHeader('Key Leadership Achievements');
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(51, 65, 85);

        resumeData.achievements.forEach(ach => {
            checkNewPage(fontSize * lineHeight);
            doc.text(`◆  ${ach}`, margin, y);
            y += fontSize * lineHeight;
        });
        y += sectionGap;
    }

    // --- EDUCATION ---
    if (resumeData.education && resumeData.education.length > 0) {
        drawSectionHeader('Education');

        resumeData.education.forEach(edu => {
            checkNewPage(25);

            doc.setFont('times', 'bold');
            doc.setFontSize(fontSize + 1);
            doc.setTextColor(15, 23, 42);
            doc.text(edu.degree || '', margin, y);

            if (edu.dates) {
                doc.setFont('times', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(100, 116, 139);
                doc.text(edu.dates, margin + contentWidth, y, { align: 'right' });
            }

            y += fontSize * 1.2;

            if (edu.institution) {
                doc.setFont('times', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(71, 85, 105);
                doc.text(edu.institution, margin, y);
                y += fontSize * 1.2;
            }

            y += itemGap;
        });
    }

    doc.setProperties({
        title: `${resumeData.name || 'Executive'} - Executive Resume`,
        subject: 'Executive Resume',
        author: resumeData.name || 'Executive',
        keywords: 'Executive, Leadership, Management, Resume, ATS, Prepnex AI',
        creator: 'Prepnex AI'
    });

    return doc;
}

export default renderExecutiveTemplate;
