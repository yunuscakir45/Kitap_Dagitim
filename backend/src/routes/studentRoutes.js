const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// GET /api/students -> Bütün aktif öğrencileri getir
router.get('/', studentController.getStudents);

// POST /api/students -> Yeni öğrenci ekle
router.post('/', studentController.createStudent);

// POST /api/students/bulk -> Toplu öğrenci ekle
router.post('/bulk', studentController.createManyStudents);

// DELETE /api/students/:id -> Öğrenciyi sil (soft delete)
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
