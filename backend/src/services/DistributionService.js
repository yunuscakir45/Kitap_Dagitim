const prisma = require('../utils/prisma');
const { matchBooksToStudents } = require('../utils/algorithm');
const bookService = require('./BookService');

/**
 * Service to handle distribution-related business logic
 */
class DistributionService {
    /**
     * Runs the distribution algorithm based on attendance.
     * @param {Array} attendance - [{ studentId, status: 'PRESENT'|'ABSENT'|'NO_BOOK'|'LOST_BOOK' }]
     * @param {string} note - Optional distribution note
     */
    async runDistribution(attendance, note) {
        // 1. Get all active students with their current books and read counts
        const allActiveStudents = await prisma.student.findMany({
            where: { isActive: true },
            include: { 
                currentBooks: true,
                _count: {
                    select: { readingHistory: true }
                }
            }
        });

        // 2. Identify students who will receive books (PRESENT or LOST_BOOK)
        // Sort by read count descending so most experienced readers get priority in the algorithm
        const receivingStudents = allActiveStudents.filter(s => {
            const attn = attendance.find(a => a.studentId === s.id);
            return attn && (attn.status === 'PRESENT' || attn.status === 'LOST_BOOK');
        }).sort((a, b) => (b._count?.readingHistory || 0) - (a._count?.readingHistory || 0));

        const noBookStudentIds = attendance
            .filter(a => a.status === 'NO_BOOK')
            .map(a => a.studentId);

        const lostBookStudentIds = attendance
            .filter(a => a.status === 'LOST_BOOK')
            .map(a => a.studentId);

        // 3. Construct Book Pool
        // a) Books from students who are PRESENT (and didn't lose/forget)
        let bookPoolIds = [];
        allActiveStudents.forEach(s => {
            const attn = attendance.find(a => a.studentId === s.id);
            // If they are PRESENT and have books, those books go into the pool
            if (attn && attn.status === 'PRESENT' && !noBookStudentIds.includes(s.id)) {
                s.currentBooks.forEach(b => {
                    bookPoolIds.push(b.id);
                });
            }
        });

        // b) Add unassigned active books
        const unassignedBooks = await prisma.book.findMany({
            where: {
                isActive: true,
                currentHolderStudentId: null
            }
        });
        unassignedBooks.forEach(b => bookPoolIds.push(b.id));

        if (bookPoolIds.length === 0) {
            throw new Error('Dağıtılacak kitap havuzu boş.');
        }

        if (receivingStudents.length > bookPoolIds.length) {
            throw new Error(`Sınıftaki mevcut öğrenci sayısı (${receivingStudents.length}) havuzdaki kitaplardan (${bookPoolIds.length}) fazla.`);
        }

        const poolBooks = await prisma.book.findMany({
            where: { id: { in: bookPoolIds } }
        });

        // 4. Build History Graph for Algorithm
        const historyGraph = {};
        for (let s of receivingStudents) {
            const readHistories = await prisma.readingHistory.findMany({
                where: { studentId: s.id },
                select: { bookId: true }
            });
            const readBookIds = readHistories.map(h => h.bookId);
            const unreadPoolBooks = poolBooks.filter(b => !readBookIds.includes(b.id));
            historyGraph[s.id] = unreadPoolBooks.map(b => b.id);

            if (unreadPoolBooks.length === 0) {
                throw new Error(`${s.fullName} sınıftaki tüm kitapları okumuş!`);
            }
        }

        // 5. Match
        const matchResult = matchBooksToStudents(receivingStudents, poolBooks, historyGraph);
        if (!matchResult.success) {
            throw new Error(matchResult.error);
        }

        const finalMatches = matchResult.matches;

        // 6. Transactional Save
        return await prisma.$transaction(async (tx) => {
            // Mark lost books as lost
            for (const studentId of lostBookStudentIds) {
                const student = allActiveStudents.find(s => s.id === studentId);
                if (student && student.currentBooks.length > 0) {
                    for (const book of student.currentBooks) {
                        await bookService.markAsLost(book.id, studentId, tx);
                    }
                }
            }

            const newDist = await tx.distribution.create({
                data: {
                    note: note || 'Otomatik dağıtım',
                    createdBy: 'Sistem'
                }
            });

            const snapshotData = attendance.map(a => ({
                distributionId: newDist.id,
                studentId: a.studentId,
                status: a.status
            }));
            await tx.attendanceSnapshot.createMany({ data: snapshotData });

            const distItems = [];
            const historyItems = [];

            for (const [studentIdStr, newBookId] of Object.entries(finalMatches)) {
                const stuId = parseInt(studentIdStr);
                const bookToGive = poolBooks.find(b => b.id === newBookId);
                const fromStudentId = bookToGive.currentHolderStudentId;

                distItems.push({
                    distributionId: newDist.id,
                    bookId: newBookId,
                    fromStudentId: fromStudentId || null,
                    toStudentId: stuId
                });

                historyItems.push({
                    studentId: stuId,
                    bookId: newBookId,
                    distributionId: newDist.id
                });

                await tx.book.update({
                    where: { id: newBookId },
                    data: { currentHolderStudentId: stuId }
                });
            }

            if (distItems.length > 0) await tx.distributionItem.createMany({ data: distItems });
            if (historyItems.length > 0) await tx.readingHistory.createMany({ data: historyItems });

            return { distribution: newDist, matches: finalMatches };
        });
    }

    /**
     * Undo a distribution, including reverting lost book statuses if they were part of it
     */
    async undoDistribution(distributionId) {
        const id = parseInt(distributionId);
        const distribution = await prisma.distribution.findUnique({
            where: { id },
            include: { 
                items: true,
                attendance: true
            }
        });

        if (!distribution) throw new Error('Dağıtım kaydı bulunamadı.');

        return await prisma.$transaction(async (tx) => {
            // 1. Revert book holders based on items
            for (const item of distribution.items) {
                await tx.book.update({
                    where: { id: item.bookId },
                    data: { currentHolderStudentId: item.fromStudentId }
                });
            }

            // 2. IMPORTANT: If there were LOST_BOOK statuses, we need to find those books and reactivate them
            // We need to check students who were LOST_BOOK in this distribution's snapshot
            const lostAttendances = distribution.attendance.filter(a => a.status === 'LOST_BOOK');
            for (const attn of lostAttendances) {
                // Find books that were lost by this student exactly at the time of this distribution
                // Since we don't have a direct link from loss to distribution, we use the timestamp
                // But a better way is to find books lostBy this student that are currently inactive
                const booksToRecover = await tx.book.findMany({
                    where: {
                        lostByStudentId: attn.studentId,
                        isActive: false,
                        // Margin of error for timestamp: within 5 minutes of distribution
                        lostAt: {
                            gte: new Date(distribution.distributedAt.getTime() - 5 * 60 * 1000),
                            lte: new Date(distribution.distributedAt.getTime() + 5 * 60 * 1000)
                        }
                    }
                });

                for (const book of booksToRecover) {
                    await bookService.revertLostStatus(book.id, attn.studentId, tx);
                }
            }

            // 3. Delete related logs
            await tx.readingHistory.deleteMany({ where: { distributionId: id } });
            await tx.attendanceSnapshot.deleteMany({ where: { distributionId: id } });
            await tx.distributionItem.deleteMany({ where: { distributionId: id } });
            await tx.distribution.delete({ where: { id } });

            return { success: true };
        });
    }
}

module.exports = new DistributionService();
