const prisma = require('../utils/prisma');
const { matchBooksToStudents } = require('../utils/algorithm');

// Dağıtımı başlatır (Gelen yoklama listesiyle)
const runDistribution = async (req, res) => {
    try {
        const { attendance, note } = req.body;
        // attendance format: [{ studentId: 1, status: 'PRESENT' }, { studentId: 2, status: 'ABSENT' }, { studentId: 3, status: 'NO_BOOK' }]

        // 1. Öğrencileri getir
        const allActiveStudents = await prisma.student.findMany({
            where: { isActive: true },
            include: { currentBooks: true }
        });

        // 2. Yoklamaya göre dağıtıma katılacak öğrencileri filtrele
        // Sadece PRESENT (var) olanlar kendi aralarında eşleşecek
        const presentingStudents = allActiveStudents.filter(s => {
            const attn = attendance.find(a => a.studentId === s.id);
            return attn && attn.status === 'PRESENT';
        });

        // Kitabı getirmeyenlere yenisi verilmeyecek, onların kitapları da havuza katılmayacak
        const noBookStudentIds = attendance.filter(a => a.status === 'NO_BOOK').map(a => a.studentId);

        // 3. Mevcut kitap havuzunu oluştur
        // a) Sınıfta olup kitabını getiren (PRESENT) öğrencilerin ellerindeki kitapları havuza al
        let bookPoolIds = [];
        presentingStudents.forEach(s => {
            if (!noBookStudentIds.includes(s.id)) {
                s.currentBooks.forEach(b => {
                    bookPoolIds.push(b.id);
                });
            }
        });

        // b) Şu an KİMSEYE AİT OLMAYAN (kütüphanede boşta bekleyen) aktif kitapları da havuza ekle
        const unassignedBooks = await prisma.book.findMany({
            where: {
                isActive: true,
                currentHolderStudentId: null
            }
        });

        unassignedBooks.forEach(b => {
            bookPoolIds.push(b.id);
        });

        // Havuz boşsa işlemi durdur
        if (bookPoolIds.length === 0) {
            return res.status(400).json({ error: 'Dağıtılacak kitap havuzu boş. Lütfen sınıfa kitap ekleyiniz veya mevcut öğrencilerin elinde kitap olduğundan emin olunuz.' });
        }

        // Öğrenci sayısı kitap sayısından fazlaysa uyar
        if (presentingStudents.length > bookPoolIds.length) {
            return res.status(400).json({ error: `Sınıftaki mevcut öğrenci sayısı (${presentingStudents.length}) havuzdaki kitaplardan (${bookPoolIds.length}) fazla. Dağıtım yapılamıyor.` });
        }

        // Book havuzu detaylarını al
        const poolBooks = await prisma.book.findMany({
            where: { id: { in: bookPoolIds } }
        });

        // 4. Öğrencilerin geçmişini çek (historyGraph oluşturmak için)
        // present öğrencilerin daha önce okudukları kitapları çıkartıp sadece havuzdan OKUMADIKLARI'nı aday olarak ekle
        const historyGraph = {}; // { studentId: [adayBookId1, adayBookId2] }

        for (let s of presentingStudents) {
            const readHistories = await prisma.readingHistory.findMany({
                where: { studentId: s.id },
                select: { bookId: true }
            });
            const readBookIds = readHistories.map(h => h.bookId);

            // Havuzdaki kitaplardan okumadıklarını filtrele
            const unreadPoolBooks = poolBooks.filter(b => !readBookIds.includes(b.id));
            historyGraph[s.id] = unreadPoolBooks.map(b => b.id);

            if (unreadPoolBooks.length === 0) {
                return res.status(400).json({ error: `${s.fullName} sınıftaki tüm kitapları okumuş! Dağıtım iptal edildi.` });
            }
        }

        // 5. Algoritmayı çalıştır (Maksimum Bipartite Eşleme)
        // NOT: Geri dönüş { success: true, matches: { studentId: bookId } }
        const matchResult = matchBooksToStudents(presentingStudents, poolBooks, historyGraph);

        if (!matchResult.success) {
            return res.status(400).json({ error: matchResult.error });
        }

        // 6. İşlemi Transaction içerisinde kaydet
        const finalMatches = matchResult.matches; // { [studentId]: bookId }

        const result = await prisma.$transaction(async (tx) => {
            // Yeni Dağıtım (Distribution) kaydı
            const newDist = await tx.distribution.create({
                data: {
                    note: note || 'Otomatik dağıtım',
                    createdBy: 'Sistem'
                }
            });

            // Attendance snapshot
            const snapshotData = attendance.map(a => ({
                distributionId: newDist.id,
                studentId: a.studentId,
                status: a.status
            }));
            await tx.attendanceSnapshot.createMany({ data: snapshotData });

            // Eşleşmeleri kaydet ve kitap sahiplerini değiştir
            const distItems = [];
            const historyItems = [];

            for (const [studentIdStr, newBookId] of Object.entries(finalMatches)) {
                const stuId = parseInt(studentIdStr);
                const bookToGive = poolBooks.find(b => b.id === newBookId);

                // Kitabın önceki sahibi
                const fromStudentId = bookToGive.currentHolderStudentId;

                // Distribution item ekle
                distItems.push({
                    distributionId: newDist.id,
                    bookId: newBookId,
                    fromStudentId: fromStudentId || null,
                    toStudentId: stuId
                });

                // Öğrencinin geçmişine ekle
                historyItems.push({
                    studentId: stuId,
                    bookId: newBookId,
                    distributionId: newDist.id
                });

                // Kitabın currentHolder alanını DA güncelle
                await tx.book.update({
                    where: { id: newBookId },
                    data: { currentHolderStudentId: stuId }
                });
            }

            if (distItems.length > 0) {
                await tx.distributionItem.createMany({ data: distItems });
            }
            if (historyItems.length > 0) {
                await tx.readingHistory.createMany({ data: historyItems });
            }

            return newDist;
        });

        res.status(200).json({
            message: 'Dağıtım başarıyla tamamlandı.',
            distribution: result,
            matches: finalMatches
        });

    } catch (error) {
        console.error('Error running distribution:', error);
        res.status(500).json({ error: 'Dağıtım işlemi sırasında bir hata oluştu.' });
    }
};

// Dağıtımları listeler
const getDistributions = async (req, res) => {
    try {
        const distributions = await prisma.distribution.findMany({
            orderBy: { distributedAt: 'desc' },
            include: {
                items: {
                    include: {
                        fromStudent: true,
                        toStudent: true,
                        book: true
                    }
                }
            }
        });
        res.json(distributions);
    } catch (error) {
        res.status(500).json({ error: 'Dağıtımlar getirilirken hata oluştu.' });
    }
};

// Belirli bir dağıtımı geri alır (Undo)
const undoDistribution = async (req, res) => {
    try {
        const { id } = req.params;
        const distributionId = parseInt(id);

        // Dağıtımı ve öğelerini getir
        const distribution = await prisma.distribution.findUnique({
            where: { id: distributionId },
            include: {
                items: true
            }
        });

        if (!distribution) {
            return res.status(404).json({ error: 'Dağıtım kaydı bulunamadı.' });
        }

        // Geri alma işlemini Transaction içerisinde yap
        await prisma.$transaction(async (tx) => {

            // Her bir DistributionItem için kitabın sahibini "fromStudentId" olarak geri çevir
            for (const item of distribution.items) {
                // Eğer fromStudentId null ise kitap daha önce kimseye ait değildi.
                // Mevcut durumda kitabın sahibi toStudentId olarak görünüyor. Bunu geri döndüreceğiz.
                await tx.book.update({
                    where: { id: item.bookId },
                    data: { currentHolderStudentId: item.fromStudentId }
                });
            }

            // 1. ReadingHistory kayıtlarını sil
            await tx.readingHistory.deleteMany({
                where: { distributionId: distributionId }
            });

            // 2. AttendanceSnapshot kayıtlarını sil
            await tx.attendanceSnapshot.deleteMany({
                where: { distributionId: distributionId }
            });

            // 3. Distribution kayıtlarını sil
            // (Cascade delete olduğu için Distribution item'lar otomatik silinecektir)
            await tx.distributionItem.deleteMany({
                where: { distributionId: distributionId }
            });

            await tx.distribution.delete({
                where: { id: distributionId }
            });

        });

        res.json({ message: 'Dağıtım işlemi başarıyla geri alındı.' });

    } catch (error) {
        console.error('Error undoing distribution:', error);
        res.status(500).json({ error: 'Dağıtım geri alınırken bir hata oluştu.' });
    }
};

// Bir öğrencinin okuma geçmişini getir
const getStudentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = parseInt(id);

        const history = await prisma.readingHistory.findMany({
            where: { studentId: studentId },
            include: {
                book: true,
                distribution: true
            },
            orderBy: { readAt: 'desc' }
        });

        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Öğrencinin okuma geçmişi getirilirken hata oluştu.' });
    }
};

module.exports = {
    runDistribution,
    getDistributions,
    undoDistribution,
    getStudentHistory
};
