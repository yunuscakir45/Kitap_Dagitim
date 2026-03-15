import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
    primary: [79, 70, 229],       // Indigo-600
    primaryLight: [238, 242, 255], // Indigo-50
    dark: [30, 41, 59],           // Slate-800
    medium: [100, 116, 139],      // Slate-500
    light: [241, 245, 249],       // Slate-100
    white: [255, 255, 255],
    accent: [16, 185, 129],       // Emerald-500
};

/**
 * Adds the common header to a PDF page.
 */
const addHeader = (doc, title, subtitle) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header background
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 18);

    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 30);

    // Date
    const now = new Date().toLocaleDateString('tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    doc.setFontSize(8);
    doc.text(`Rapor Tarihi: ${now}`, pageWidth - 14, 30, { align: 'right' });
};

/**
 * Adds footer with page numbers.
 */
const addFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.medium);
        doc.text(
            `Sayfa ${i} / ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
        doc.text(
            'Kitap Dagitim Sistemi',
            14,
            pageHeight - 10
        );
    }
};

/**
 * Generates a PDF report for a single student.
 */
export const generateStudentPdf = (data) => {
    const doc = new jsPDF();
    const { student, currentBooks, readingHistory, stats } = data;

    // Header
    addHeader(
        doc,
        'Ogrenci Okuma Raporu',
        `${student.fullName}${student.studentNumber ? ` (No: ${student.studentNumber})` : ''}`
    );

    let yPos = 50;

    // Student Info Card
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(14, yPos, doc.internal.pageSize.getWidth() - 28, 30, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.dark);
    doc.setFont('helvetica', 'bold');
    doc.text('Ogrenci Bilgileri', 20, yPos + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.medium);
    doc.text(`Ad Soyad: ${student.fullName}`, 20, yPos + 16);
    doc.text(`Ogrenci No: ${student.studentNumber || 'Belirtilmemis'}`, 120, yPos + 16);
    doc.text(`Toplam Okunan Kitap: ${stats.totalBooksRead}`, 20, yPos + 24);
    doc.text(`Elindeki Kitap Sayisi: ${stats.currentBookCount}`, 120, yPos + 24);

    yPos += 40;

    // Stats Boxes
    const boxWidth = (doc.internal.pageSize.getWidth() - 42) / 3;

    // Box 1: Total Read
    doc.setFillColor(...COLORS.primaryLight);
    doc.roundedRect(14, yPos, boxWidth, 22, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(String(stats.totalBooksRead), 14 + boxWidth / 2, yPos + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.medium);
    doc.text('Okunan Kitap', 14 + boxWidth / 2, yPos + 18, { align: 'center' });

    // Box 2: Current
    doc.setFillColor(209, 250, 229); // Emerald-100
    doc.roundedRect(14 + boxWidth + 7, yPos, boxWidth, 22, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.accent);
    doc.setFont('helvetica', 'bold');
    doc.text(String(stats.currentBookCount), 14 + boxWidth + 7 + boxWidth / 2, yPos + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.medium);
    doc.text('Elinde Mevcut', 14 + boxWidth + 7 + boxWidth / 2, yPos + 18, { align: 'center' });

    // Box 3: Registration
    doc.setFillColor(254, 243, 199); // Amber-100
    doc.roundedRect(14 + (boxWidth + 7) * 2, yPos, boxWidth, 22, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setTextColor(180, 83, 9);  // Amber-700
    doc.setFont('helvetica', 'bold');
    const regDate = student.createdAt
        ? new Date(student.createdAt).toLocaleDateString('tr-TR')
        : '-';
    doc.text(regDate, 14 + (boxWidth + 7) * 2 + boxWidth / 2, yPos + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.medium);
    doc.text('Kayit Tarihi', 14 + (boxWidth + 7) * 2 + boxWidth / 2, yPos + 18, { align: 'center' });

    yPos += 32;

    // Current Books Section
    if (currentBooks.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(...COLORS.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('Elindeki Kitaplar', 14, yPos);
        yPos += 6;

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Kitap No', 'Kitap Adi', 'Yazar']],
            body: currentBooks.map((b, i) => [
                i + 1,
                b.labelNumber || '-',
                b.title || 'Isimsiz',
                b.author || '-',
            ]),
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.accent,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 9,
            },
            bodyStyles: { fontSize: 9, textColor: COLORS.dark },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            margin: { left: 14, right: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 10;
    }

    // Reading History Table
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.dark);
    doc.setFont('helvetica', 'bold');
    doc.text('Okuma Gecmisi', 14, yPos);
    yPos += 6;

    if (readingHistory.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.medium);
        doc.setFont('helvetica', 'italic');
        doc.text('Henuz okuma gecmisi bulunmamaktadir.', 14, yPos + 6);
    } else {
        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Kitap No', 'Kitap Adi', 'Yazar', 'Okuma Tarihi']],
            body: readingHistory.map((h, i) => [
                i + 1,
                h.book.labelNumber || '-',
                h.book.title || 'Isimsiz',
                h.book.author || '-',
                new Date(h.readAt).toLocaleDateString('tr-TR'),
            ]),
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.primary,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 9,
            },
            bodyStyles: { fontSize: 9, textColor: COLORS.dark },
            alternateRowStyles: { fillColor: COLORS.primaryLight },
            margin: { left: 14, right: 14 },
        });
    }

    addFooter(doc);

    // Save
    const safeName = student.fullName.replace(/[^a-zA-Z0-9\u00C0-\u024F\u0400-\u04FF]/g, '_');
    doc.save(`Okuma_Raporu_${safeName}.pdf`);
};

/**
 * Generates a PDF report for the entire class.
 */
export const generateClassPdf = (data) => {
    const doc = new jsPDF();
    const { classStats, students } = data;

    // Header
    addHeader(doc, 'Sinif Okuma Raporu', `Toplam ${classStats.totalStudents} Ogrenci`);

    let yPos = 50;

    // Class Stats
    const pageWidth = doc.internal.pageSize.getWidth();
    const boxWidth = (pageWidth - 42) / 4;
    const statsData = [
        { value: classStats.totalStudents, label: 'Ogrenci', color: COLORS.primary, bg: COLORS.primaryLight },
        { value: classStats.totalBooks, label: 'Kitap', color: COLORS.accent, bg: [209, 250, 229] },
        { value: classStats.totalDistributions, label: 'Dagitim', color: [180, 83, 9], bg: [254, 243, 199] },
        { value: classStats.totalBooksRead, label: 'Toplam Okuma', color: [147, 51, 234], bg: [243, 232, 255] },
    ];

    statsData.forEach((stat, i) => {
        const x = 14 + i * (boxWidth + 7);
        doc.setFillColor(...stat.bg);
        doc.roundedRect(x, yPos, boxWidth, 22, 2, 2, 'F');
        doc.setFontSize(16);
        doc.setTextColor(...stat.color);
        doc.setFont('helvetica', 'bold');
        doc.text(String(stat.value), x + boxWidth / 2, yPos + 10, { align: 'center' });
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.medium);
        doc.text(stat.label, x + boxWidth / 2, yPos + 18, { align: 'center' });
    });

    yPos += 32;

    // Summary Table
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.dark);
    doc.setFont('helvetica', 'bold');
    doc.text('Ogrenci Ozet Tablosu', 14, yPos);
    yPos += 6;

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Ogrenci No', 'Ad Soyad', 'Okunan Kitap', 'Elindeki Kitap']],
        body: students.map((s, i) => [
            i + 1,
            s.student.studentNumber || '-',
            s.student.fullName,
            s.totalBooksRead,
            s.currentBooks.length > 0
                ? s.currentBooks.map(b => `${b.title || 'Isimsiz'} (#${b.labelNumber})`).join(', ')
                : 'Yok',
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: COLORS.primary,
            textColor: COLORS.white,
            fontStyle: 'bold',
            fontSize: 9,
        },
        bodyStyles: { fontSize: 8, textColor: COLORS.dark },
        alternateRowStyles: { fillColor: COLORS.primaryLight },
        margin: { left: 14, right: 14 },
        columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 25 },
            3: { cellWidth: 22, halign: 'center' },
        },
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Per-student detail sections
    students.forEach((entry) => {
        if (entry.readingHistory.length === 0) return;

        // Check page space
        if (yPos > doc.internal.pageSize.getHeight() - 50) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(...COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.text(
            `${entry.student.fullName}${entry.student.studentNumber ? ` (No: ${entry.student.studentNumber})` : ''}`,
            14, yPos
        );
        yPos += 5;

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Kitap No', 'Kitap Adi', 'Yazar', 'Tarih']],
            body: entry.readingHistory.map((h, i) => [
                i + 1,
                h.book.labelNumber || '-',
                h.book.title || 'Isimsiz',
                h.book.author || '-',
                new Date(h.readAt).toLocaleDateString('tr-TR'),
            ]),
            theme: 'striped',
            headStyles: {
                fillColor: [100, 116, 139],
                textColor: COLORS.white,
                fontSize: 8,
            },
            bodyStyles: { fontSize: 8, textColor: COLORS.dark },
            margin: { left: 14, right: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 10;
    });

    addFooter(doc);

    doc.save('Sinif_Okuma_Raporu.pdf');
};
