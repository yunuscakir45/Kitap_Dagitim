const prisma = require('../utils/prisma');

/**
 * Get a single student's reading report data.
 * GET /api/reports/student/:id
 */
const getStudentReport = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = parseInt(id);

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                currentBooks: true,
            }
        });

        if (!student) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı.' });
        }

        const readingHistory = await prisma.readingHistory.findMany({
            where: { studentId: studentId },
            include: {
                book: true,
                distribution: true,
            },
            orderBy: { readAt: 'desc' }
        });

        res.json({
            student: {
                id: student.id,
                fullName: student.fullName,
                studentNumber: student.studentNumber,
                createdAt: student.createdAt,
            },
            currentBooks: student.currentBooks.map(b => ({
                id: b.id,
                labelNumber: b.labelNumber,
                title: b.title,
                author: b.author,
            })),
            readingHistory: readingHistory.map(h => ({
                id: h.id,
                readAt: h.readAt,
                book: {
                    id: h.book.id,
                    labelNumber: h.book.labelNumber,
                    title: h.book.title,
                    author: h.book.author,
                    isbn: h.book.isbn,
                },
                distributionDate: h.distribution?.distributedAt || null,
            })),
            stats: {
                totalBooksRead: readingHistory.length,
                currentBookCount: student.currentBooks.length,
            }
        });
    } catch (error) {
        console.error('Error generating student report:', error);
        res.status(500).json({ error: 'Öğrenci raporu oluşturulurken hata oluştu.' });
    }
};

/**
 * Get entire class reading report data.
 * GET /api/reports/class
 */
const getClassReport = async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            where: { isActive: true },
            include: {
                currentBooks: true,
                readingHistory: {
                    include: {
                        book: true,
                    },
                    orderBy: { readAt: 'desc' }
                }
            },
            orderBy: { fullName: 'asc' }
        });

        const totalBooks = await prisma.book.count({
            where: { isActive: true }
        });

        const totalDistributions = await prisma.distribution.count();

        const report = students.map(student => ({
            student: {
                id: student.id,
                fullName: student.fullName,
                studentNumber: student.studentNumber,
            },
            currentBooks: student.currentBooks.map(b => ({
                labelNumber: b.labelNumber,
                title: b.title,
                author: b.author,
            })),
            readingHistory: student.readingHistory.map(h => ({
                readAt: h.readAt,
                book: {
                    labelNumber: h.book.labelNumber,
                    title: h.book.title,
                    author: h.book.author,
                }
            })),
            totalBooksRead: student.readingHistory.length,
        }));

        res.json({
            generatedAt: new Date().toISOString(),
            classStats: {
                totalStudents: students.length,
                totalBooks: totalBooks,
                totalDistributions: totalDistributions,
                totalBooksRead: students.reduce((sum, s) => sum + s.readingHistory.length, 0),
            },
            students: report,
        });
    } catch (error) {
        console.error('Error generating class report:', error);
        res.status(500).json({ error: 'Sınıf raporu oluşturulurken hata oluştu.' });
    }
};

module.exports = {
    getStudentReport,
    getClassReport,
};
