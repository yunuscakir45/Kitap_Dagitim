const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// GET /api/books -> Bütün aktif kitapları getir
router.get('/', bookController.getBooks);

// POST /api/books -> Yeni kitap ekle
router.post('/', bookController.createBook);

// POST /api/books/bulk -> Toplu kitap ekle
router.post('/bulk', bookController.createManyBooks);

// DELETE /api/books/:id -> Kitabı sil (soft delete)
router.delete('/:id', bookController.deleteBook);

// POST /api/books/:id/reactivate -> Kayıp kitabı aktifleştir
router.post('/:id/reactivate', bookController.reactivateBook);

module.exports = router;
