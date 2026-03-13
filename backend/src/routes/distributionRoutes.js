const express = require('express');
const router = express.Router();
const distributionController = require('../controllers/distributionController');

// GET /api/distributions -> Tüm dağıtımları listele
router.get('/', distributionController.getDistributions);

// POST /api/distributions/run -> Yeni bir dağıtım başlat (yoklama listesiyle)
router.post('/run', distributionController.runDistribution);

// POST /api/distributions/:id/undo -> Belirtilen dağıtımı geri al
router.post('/:id/undo', distributionController.undoDistribution);

// GET /api/distributions/history/student/:id -> Belirli öğrencinin okuma geçmişi
router.get('/history/student/:id', distributionController.getStudentHistory);

module.exports = router;
