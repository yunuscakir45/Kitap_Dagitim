const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

// POST /api/admin/reset-all -> Tüm veritabanını sıfırlar
router.post('/reset-all', async (req, res) => {
    try {
        const { confirm } = req.body;

        // Çift onay kontrolü 
        if (confirm !== 'YES_RESET_EVERYTHING') {
            return res.status(400).json({ error: 'Sıfırlama işlemi için geçerli onay metni gönderilmedi.' });
        }

        await prisma.$transaction([
            prisma.attendanceSnapshot.deleteMany(),
            prisma.readingHistory.deleteMany(),
            prisma.distributionItem.deleteMany(),
            prisma.distribution.deleteMany(),
            prisma.book.deleteMany(),
            prisma.student.deleteMany(),
        ]);

        res.json({ message: 'Tüm sistem verileri başarıyla sıfırlandı.' });
    } catch (error) {
        console.error('Error resetting system:', error);
        res.status(500).json({ error: 'Sistem sıfırlanırken bir hata oluştu.' });
    }
});

module.exports = router;
