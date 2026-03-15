const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// GET /api/reports/student/:id -> Get single student reading report
router.get('/student/:id', reportController.getStudentReport);

// GET /api/reports/class -> Get entire class reading report
router.get('/class', reportController.getClassReport);

module.exports = router;
