const prisma = require('../utils/prisma');

/**
 * Service to handle book-related business logic
 */
class BookService {
    /**
     * Marks a book as lost by a specific student.
     * @param {number} bookId - The ID of the book to mark as lost
     * @param {number} studentId - The ID of the student who lost the book
     * @param {object} tx - (Optional) Prisma transaction context
     */
    async markAsLost(bookId, studentId, tx = prisma) {
        return await tx.book.update({
            where: { id: parseInt(bookId) },
            data: {
                isActive: false,
                currentHolderStudentId: null,
                lostByStudentId: parseInt(studentId),
                lostAt: new Date()
            }
        });
    }

    /**
     * Reactivates a previously lost or inactive book.
     * @param {number} bookId - The ID of the book to reactivate
     */
    async reactivateBook(bookId) {
        return await prisma.book.update({
            where: { id: parseInt(bookId) },
            data: {
                isActive: true,
                lostByStudentId: null,
                lostAt: null
            }
        });
    }

    /**
     * Reverts a lost status (used in undo operations).
     * @param {number} bookId - The ID of the book
     * @param {number|null} originalHolderId - The ID of the student who had it before
     * @param {object} tx - Prisma transaction context
     */
    async revertLostStatus(bookId, originalHolderId, tx) {
        return await tx.book.update({
            where: { id: parseInt(bookId) },
            data: {
                isActive: true,
                currentHolderStudentId: originalHolderId,
                lostByStudentId: null,
                lostAt: null
            }
        });
    }
}

module.exports = new BookService();
