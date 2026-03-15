const prisma = require('../utils/prisma');

/**
 * Service to handle student-related business logic
 */
class StudentService {
    /**
     * Deletes a student with options to handle their current books.
     * @param {number} studentId - The ID of the student to delete
     * @param {Object} options - Deletion options
     * @param {boolean} options.returnBooks - If true, books are returned to the library. If false, books are marked as inactive (lost).
     */
    async deleteStudent(studentId, options = { returnBooks: true }) {
        const id = parseInt(studentId);
        
        // 1. Get student and their current books
        const student = await prisma.student.findUnique({
            where: { id },
            include: { currentBooks: true }
        });

        if (!student) {
            throw new Error('Öğrenci bulunamadı.');
        }

        const { currentBooks } = student;

        // Start a transaction to ensure atomicity
        return await prisma.$transaction(async (tx) => {
            // 2. Handle books if any
            if (currentBooks.length > 0) {
                for (const book of currentBooks) {
                    if (options.returnBooks) {
                        // Option A: Return to library (available for next student)
                        await tx.book.update({
                            where: { id: book.id },
                            data: { currentHolderStudentId: null }
                        });
                    } else {
                        // Option B: Book is lost (mark as inactive)
                        await tx.book.update({
                            where: { id: book.id },
                            data: { 
                                isActive: false,
                                currentHolderStudentId: null 
                            }
                        });
                    }
                }
            }

            // 3. Soft delete the student
            const deletedStudent = await tx.student.update({
                where: { id },
                data: { isActive: false }
            });

            return deletedStudent;
        });
    }
}

module.exports = new StudentService();
