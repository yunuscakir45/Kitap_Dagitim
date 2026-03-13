const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// GET /api/books -> Bütün aktif kitapları getir
router.get('/', bookController.getBooks);

// POST /api/books -> Yeni kitap ekle
router.post('/', bookController.createBook);

// DELETE /api/books/:id -> Kitabı sil (soft delete)
router.delete('/:id', bookController.deleteBook);

module.exports = router;
