const prisma = require('../utils/prisma');

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

// Öğrenciyi siler (Soft Delete - isActive: false)
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        // Öğrencinin elinde kitap var mı kontrol et
        const student = await prisma.student.findUnique({
            where: { id: parseInt(id) },
            include: { currentBooks: true }
        });

        if (!student) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı.' });
        }

        if (student.currentBooks.length > 0) {
            return res.status(400).json({ error: 'Öğrencinin elinde kitap varken silinemez. Lütfen önce kitabı teslim alınız.' });
        }

        // Soft delete
        const deletedStudent = await prisma.student.update({
            where: { id: parseInt(id) },
            data: { isActive: false },
        });

        res.json({ message: 'Öğrenci başarıyla silindi.', student: deletedStudent });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Öğrenci silinirken bir hata oluştu.' });
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
