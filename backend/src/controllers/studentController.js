const prisma = require('../utils/prisma');
const studentService = require('../services/StudentService');

// Bütün aktif öğrencileri getirir
const getStudents = async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            where: { isActive: true },
            include: {
                currentBooks: true, // Öğrencinin elindeki mevcut kitaplar
            }
        });
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Öğrenciler getirilirken bir hata oluştu.' });
    }
};

// Yeni öğrenci ekler
const createStudent = async (req, res) => {
    try {
        const { fullName, studentNumber } = req.body;

        if (!fullName || fullName.trim() === '') {
            return res.status(400).json({ error: 'Öğrenci adı boş olamaz.' });
        }

        const student = await prisma.student.create({
            data: {
                fullName: fullName.trim(),
                studentNumber: studentNumber || null,
            },
        });

        res.status(201).json(student);
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Öğrenci eklenirken bir hata oluştu.' });
    }
};

/**
 * Öğrenciyi siler
 * @param {boolean} req.body.returnBooks - Kitaplar iade mi edildi? (Default: true)
 */
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { returnBooks } = req.body;

        const deletedStudent = await studentService.deleteStudent(id, { 
            returnBooks: returnBooks !== undefined ? returnBooks : true 
        });

        res.json({ 
            message: 'Öğrenci başarıyla silindi.', 
            student: deletedStudent 
        });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ 
            error: error.message || 'Öğrenci silinirken bir hata oluştu.' 
        });
    }
};

// Toplu öğrenci ekler (OCR'dan gelen liste için)
const createManyStudents = async (req, res) => {
    try {
        const { students } = req.body;

        if (!students || !Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ error: 'Geçerli bir öğrenci listesi sağlanmadı.' });
        }

        // Geçerli olan öğrencileri filtrele (en azından isim dolu olsun)
        const validStudents = students.filter(s => s.fullName && s.fullName.trim() !== '');

        if (validStudents.length === 0) {
            return res.status(400).json({ error: 'Liste içerisindeki öğrencilerin hiçbiri geçerli değil (isim eksik).' });
        }

        // Bulk insert işlemi
        const createdCount = await prisma.student.createMany({
            data: validStudents.map(s => ({
                fullName: s.fullName.trim(),
                studentNumber: s.studentNumber || null,
            })),
            skipDuplicates: false, // İsim veya numara tekrar edebilme ihtimaline karşı her şeyi ekler (eğer Unique constraint yoksa)
        });

        res.status(201).json({ message: `${createdCount.count} öğrenci başarıyla eklendi.`, count: createdCount.count });
    } catch (error) {
        console.error('Error in createManyStudents:', error);
        res.status(500).json({ error: 'Toplu öğrenci eklenirken bir hata oluştu.' });
    }
};

module.exports = {
    getStudents,
    createStudent,
    createManyStudents,
    deleteStudent
};
