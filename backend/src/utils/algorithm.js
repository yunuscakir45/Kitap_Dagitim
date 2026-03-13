// Bipartite Matching Algorithm / Beksaç Algoritması (Backtracking DFS)
// Amaç: Öğrencileri, daha önce okumadıkları ve sınıfta mevcut olan kitaplarla eşleştirmek.

/**
 * 
 * @param {Array} students - Dağıtıma katılacak aktif öğrenciler [{ id, ... }]
 * @param {Array} books - Dağıtım havuzuna alınan mevcut kitaplar [{ id, ... }]
 * @param {Object} historyGraph - Öğrencilerin OKUMADIĞI kitapların listesi { studentId: [bookId, bookId, ...] }
 * @returns {Object} result - { success: boolean, matches: { studentId: bookId }, error: string }
 */
const matchBooksToStudents = (students, books, historyGraph) => {
    const numStudents = students.length;
    const numBooks = books.length;

    // Eşleşmeleri tutacak obje: { bookId: studentId }
    const bookAssignment = {};

    // Kitap array'indeki indexleri asıl ID'leri ile tutmak için
    const bookIds = books.map(b => b.id);
    const studentIds = students.map(s => s.id);

    // DFS ile bir öğrenci için uygun bir kitap bulmaya çalış
    const bpm = (studentId, visited) => {
        // Öğrencinin okumadığı aday kitaplar
        const candidateBookIds = historyGraph[studentId] || [];

        for (let i = 0; i < candidateBookIds.length; i++) {
            const bookId = candidateBookIds[i];

            // Kitap bu DFS döngüsü içinde daha önce ziyaret edildiyse atla
            if (visited[bookId]) continue;

            visited[bookId] = true;

            // Eğer kitap henüz kimseye atanmamışsa
            // VEYA atandığı kişi başka bir kitap alabiliyorsa, bu kitabı mevcut öğrenciye ata
            if (bookAssignment[bookId] === undefined || bpm(bookAssignment[bookId], visited)) {
                bookAssignment[bookId] = studentId;
                return true;
            }
        }
        return false;
    };

    let matchCount = 0;

    for (let i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        // Her öğrenci için visited dizisini sıfırlıyoruz
        const visited = {};
        if (bpm(studentId, visited)) {
            matchCount++;
        }
    }

    // Eğer tüm öğrenciler için bir eşleşme bulunamamışsa
    if (matchCount < numStudents) {
        // Problemli öğrenciyi tespit et
        const assignedStudents = Object.values(bookAssignment);
        const unassignedStudentIds = studentIds.filter(id => !assignedStudents.includes(id));

        const unassignedStudentNames = unassignedStudentIds.map(id => {
            const s = students.find(st => st.id === id);
            return s ? s.fullName : 'Bilinmeyen Öğrenci';
        }).join(', ');

        return {
            success: false,
            error: `Tam eşleşme sağlanamadı. Şu öğrencilere uygun kitap bulunamadı: ${unassignedStudentNames}. Lütfen öğrencilerin okuma geçmişlerini kontrol edin veya havuzdaki kitapları artırın.`,
            unassignedIds: unassignedStudentIds
        };
    }

    // Başarılı ise bookAssignment'i { studentId: bookId } şekline dönüştür
    const studentAssignments = {};
    for (const [bookId, studentId] of Object.entries(bookAssignment)) {
        studentAssignments[studentId] = parseInt(bookId);
    }

    return {
        success: true,
        matches: studentAssignments
    };
};

module.exports = {
    matchBooksToStudents
};
