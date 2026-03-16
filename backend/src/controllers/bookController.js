const prisma = require('../utils/prisma');
const bookService = require('../services/BookService');

// Bütün aktif ve kayıp kitapları getirir (Silinmişler hariç)
const getBooks = async (req, res) => {
    try {
        const books = await prisma.book.findMany({
            where: {
                OR: [
                    { isActive: true },
                    { lostAt: { not: null } }
                ]
            },
            include: {
                currentHolder: true, // Kitap şu an kimde ise getirecek
                lostBy: true,        // Kitabı kim kaybettiyse getirecek
            },
            orderBy: {
                labelNumber: 'asc'
            }
        });
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Kitaplar getirilirken bir hata oluştu.' });
    }
};

// Kayıp kitabı tekrar aktifleştirir
const reactivateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const book = await bookService.reactivateBook(id);
        res.json({ message: 'Kitap başarıyla aktifleştirildi.', book });
    } catch (error) {
        console.error('Error reactivating book:', error);
        res.status(500).json({ error: 'Kitap aktifleştirilirken bir hata oluştu.' });
    }
};

// Yeni kitap ekler
const createBook = async (req, res) => {
    try {
        const { labelNumber, title, author, isbn, coverImage } = req.body;

        let finalLabelNumber = labelNumber ? labelNumber.trim() : "";

        // Eğer labelNumber boş gelirse otomatik olarak sıradaki sayıyı bul
        if (!finalLabelNumber) {
            const allBooks = await prisma.book.findMany({
                where: { isActive: true },
            });
            // Şu anki kitap sayısına 1 ekleyerek basit bir numara üret (Gelişmiş senaryolarda son eklenenin numarasına da bakılabilir)
            finalLabelNumber = (allBooks.length + 1).toString();
        }

        // Aynı etiket numarasıyla başka aktif kitap var mı kontrolü
        const existingBook = await prisma.book.findFirst({
            where: {
                labelNumber: finalLabelNumber,
                isActive: true,
            }
        });

        if (existingBook) {
            return res.status(400).json({ error: `Bu numaraya (${finalLabelNumber}) sahip başka aktif bir kitap zaten var.` });
        }

        const book = await prisma.book.create({
            data: {
                labelNumber: finalLabelNumber,
                title: title || null,
                author: author || null,
                isbn: isbn || null,
                coverImage: coverImage || null,
            },
        });

        res.status(201).json(book);
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ error: 'Kitap eklenirken bir hata oluştu.' });
    }
};

// Kitabı siler (Soft Delete - isActive: false)
const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;

        const book = await prisma.book.findUnique({
            where: { id: parseInt(id) }
        });

        if (!book) {
            return res.status(404).json({ error: 'Kitap bulunamadı.' });
        }

        if (book.currentHolderStudentId) {
            return res.status(400).json({ error: 'Bu kitap bir öğrencide bulunduğu için silinemez. Lütfen önce iadesini alınız.' });
        }

        // Soft delete
        const deletedBook = await prisma.book.update({
            where: { id: parseInt(id) },
            data: { isActive: false },
        });

        res.json({ message: 'Kitap başarıyla silindi.', book: deletedBook });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ error: 'Kitap silinirken bir hata oluştu.' });
    }
};

module.exports = {
    getBooks,
    createBook,
    deleteBook,
    reactivateBook
};
