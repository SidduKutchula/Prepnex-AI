import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportHistoryToCSV = (history) => {
    if (!history || history.length === 0) return;

    const headers = ['Company', 'Job Title', 'ATS Score', 'Match Score', 'Readiness', 'Progress', 'Created Date'];
    const rows = history.map(item => [
        item.company || 'Unknown',
        item.title || 'Unknown',
        item.atsScore || 0,
        item.matchScore || 0,
        item.readinessScore || 0,
        item.progress || 0,
        new Date(item.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `interview-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportHistoryToJSON = (history) => {
    if (!history || history.length === 0) return;

    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `interview-history-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportHistoryToPDF = (history, analytics) => {
    if (!history || history.length === 0) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Interview Preparation History', 14, 22);

    // Analytics Summary
    if (analytics) {
        doc.setFontSize(12);
        doc.text(`Total Interviews: ${analytics.totalInterviews}`, 14, 32);
        doc.text(`Completed: ${analytics.completed}`, 70, 32);
        doc.text(`Average ATS: ${analytics.avgAts}`, 14, 40);
        doc.text(`Average Match: ${analytics.avgMatch}%`, 70, 40);
    }

    // Table
    const tableColumn = ["Company", "Role", "ATS", "Match", "Date"];
    const tableRows = [];

    history.forEach(item => {
        const reportData = [
            item.company || 'Unknown',
            item.title || 'Unknown',
            item.atsScore || 0,
            `${item.matchScore || 0}%`,
            new Date(item.createdAt).toLocaleDateString()
        ];
        tableRows.push(reportData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] } // Blue
    });

    doc.save(`interview-history-${new Date().toISOString().split('T')[0]}.pdf`);
};
