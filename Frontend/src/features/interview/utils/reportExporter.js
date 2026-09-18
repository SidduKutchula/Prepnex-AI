import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseResumeHtml } from '../../resume/utils/parseResumeHtml';
import { renderClassicTemplate } from '../../resume/pdf/templates/classic';

/**
 * Generates and downloads a comprehensive, multi-page Master Interview Preparation Report PDF.
 * @param {Object} report The complete interview report object
 */
export function exportFullMasterReportPDF(report) {
    if (!report) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);

    let y = margin;

    const checkNewPage = (needed = 24) => {
        if (y + needed > pageHeight - margin) {
            doc.addPage();
            y = margin + 15;
            // Header watermark on subsequent pages
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text('Prepnex AI — Interview Preparation Master Report', margin, margin - 10);
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, margin - 5, pageWidth - margin, margin - 5);
        }
    };

    const drawSectionTitle = (title) => {
        checkNewPage(35);
        doc.setFillColor(37, 99, 235); // Accent Blue
        doc.rect(margin, y, 4, 16, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text(title.toUpperCase(), margin + 10, y + 13);

        y += 26;
    };

    // ── COVER / HEADER BANNER ──────────────────────────────────────────
    doc.setFillColor(15, 23, 42); // Dark slate banner
    doc.rect(0, 0, pageWidth, 90, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('PREPNEX AI', margin, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(203, 213, 225);
    doc.text('Master Interview Preparation & Strategy Report', margin, 58);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date(report.createdAt || Date.now()).toLocaleDateString()}`, pageWidth - margin, 58, { align: 'right' });

    y = 110;

    // ── TARGET ROLE & SCORES SUMMARY ─────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(report.title || 'Technical Interview Strategy', margin, y);
    y += 20;

    if (report.company) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.text(`Target Company / Context: ${report.company}`, margin, y);
        y += 18;
    }

    // Score Cards Box
    const cardWidth = (contentWidth - 20) / 3;
    const cardHeight = 50;

    // ATS Score Card
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, cardWidth, cardHeight, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text(`${report.atsScore || 85}%`, margin + 14, y + 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('ATS Match Score', margin + 14, y + 40);

    // Readiness Score Card
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin + cardWidth + 10, y, cardWidth, cardHeight, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text(`${report.matchScore || report.readinessScore || 88}%`, margin + cardWidth + 24, y + 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Interview Readiness', margin + cardWidth + 24, y + 40);

    // Remaining Days Card
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin + (cardWidth * 2) + 20, y, cardWidth, cardHeight, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(139, 92, 246);
    doc.text(`${report.remainingDays || 7} Days`, margin + (cardWidth * 2) + 34, y + 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Prep Plan Schedule', margin + (cardWidth * 2) + 34, y + 40);

    y += cardHeight + 25;

    // ── ATS ANALYSIS & SKILL GAPS ────────────────────────────────────────
    if (report.skillGaps && report.skillGaps.length > 0) {
        drawSectionTitle('ATS Analysis & Key Skill Gaps');

        const tableColumn = ["Skill / Topic", "Category", "Priority", "Impact"];
        const tableRows = report.skillGaps.map(gap => [
            typeof gap === 'string' ? gap : (gap.skill || gap.title || 'Skill Gap'),
            gap.category || 'Technical',
            gap.priority || 'High',
            gap.impact || 'Recommended for resume & interview focus'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: y,
            margin: { left: margin, right: margin },
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 5 }
        });

        y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 60) + 25;
    }

    // ── TECHNICAL QUESTIONS & MODEL ANSWERS ─────────────────────────────
    const techQuestions = report.technicalQuestions || report.questions || [];
    if (techQuestions.length > 0) {
        drawSectionTitle('Tailored Technical Questions & Answer Guides');

        techQuestions.forEach((q, idx) => {
            checkNewPage(60);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            const questionTitle = `Q${idx + 1}. ${q.question || q.title || q}`;
            const splitQ = doc.splitTextToSize(questionTitle, contentWidth);
            splitQ.forEach(line => {
                checkNewPage(14);
                doc.text(line, margin, y);
                y += 14;
            });

            if (q.category || q.difficulty) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(`[${q.category || 'Technical'} | Difficulty: ${q.difficulty || 'Medium'}]`, margin + 10, y);
                y += 12;
            }

            if (q.modelAnswer || q.answer) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(51, 65, 85);
                const answerText = `Key Concepts / Model Answer: ${q.modelAnswer || q.answer}`;
                const splitAns = doc.splitTextToSize(answerText, contentWidth - 20);
                splitAns.forEach(line => {
                    checkNewPage(12);
                    doc.text(line, margin + 10, y);
                    y += 12;
                });
            }

            y += 8;
        });

        y += 15;
    }

    // ── DAY-BY-DAY PREPARATION ROADMAP ──────────────────────────────────
    const prepPlan = report.preparationPlan || [];
    if (prepPlan.length > 0) {
        drawSectionTitle('Structured Day-by-Day Preparation Roadmap');

        prepPlan.forEach(dayItem => {
            checkNewPage(40);

            const dayNum = dayItem.day || dayItem.dayNumber || 'Day';
            const rawFocus = dayItem.focus || dayItem.topic || 'Daily Preparation Focus';
            const focus = String(rawFocus).replace(/^Day\s*\d+\s*[:\-–—]\s*/i, '').trim() || 'Daily Preparation Focus';

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(37, 99, 235);
            doc.text(`Day ${dayNum}: ${focus}`, margin, y);
            y += 16;

            const tasks = dayItem.tasks || [];
            tasks.forEach(t => {
                checkNewPage(14);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(51, 65, 85);
                const taskTitle = typeof t === 'string' ? t : (t.title || t.name || 'Preparation Task');
                const taskTime = t.timeHours ? ` (${t.timeHours} hrs)` : '';
                const lineText = `• ${taskTitle}${taskTime}`;

                const splitTask = doc.splitTextToSize(lineText, contentWidth - 15);
                splitTask.forEach((line, i) => {
                    checkNewPage(12);
                    doc.text(line, margin + (i === 0 ? 10 : 18), y);
                    y += 12;
                });
            });

            y += 8;
        });

        y += 15;
    }

    // Save PDF
    const safeTitle = (report.title || 'Interview_Preparation_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`${safeTitle}_Master_Report.pdf`);
}

/**
 * Downloads both ATS Resume PDF and Full Master Preparation Report PDF.
 */
export async function downloadAllReports(report, generatePdf) {
    if (!report) return;

    // 1. Download Master Interview Preparation Report PDF
    exportFullMasterReportPDF(report);

    // 2. Download ATS Resume PDF
    if (report.rewrittenResumeHtml && generatePdf) {
        const parsedData = parseResumeHtml(report.rewrittenResumeHtml, report);
        await generatePdf(parsedData, 'classic');
    }
}

export default exportFullMasterReportPDF;
