const distributionService = require('../services/DistributionService');

// Dağıtımı başlatır (Gelen yoklama listesiyle)
const runDistribution = async (req, res) => {
    try {
        const { attendance, note } = req.body;
        const result = await distributionService.runDistribution(attendance, note);
        res.json(result);
    } catch (error) {
        console.error('Error running distribution:', error);
        res.status(500).json({ error: error.message || 'Dağıtım işlemi sırasında bir hata oluştu.' });
    }
};

// Dağıtımları listeler (Henüz bir servis katmanı yazılmadı, controller'da kalabilir veya orası da taşınabilir)
const prisma = require('../utils/prisma'); // Keep for getDistributions
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
        await distributionService.undoDistribution(id);
        res.json({ message: 'Dağıtım işlemi başarıyla geri alındı.' });
    } catch (error) {
        console.error('Error undoing distribution:', error);
        res.status(500).json({ error: error.message || 'Dağıtım geri alınırken bir hata oluştu.' });
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
