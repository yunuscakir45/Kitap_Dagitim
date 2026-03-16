import React, { useState, useEffect } from 'react';
import { studentApi, reportApi } from '../api';
import { UserPlus, Trash2, BookUser, ScanText, CheckCircle2, AlertCircle, Download, FileDown, Book as BookIcon } from 'lucide-react';
import OCRScanner from '../components/OCRScanner';
import DeleteStudentModal from '../components/DeleteStudentModal';
import StudentProfileModal from '../components/StudentProfileModal';
import { generateStudentPdf, generateClassPdf } from '../utils/pdfGenerator';

const Students = () => {
    const [students, setStudents] = useState([]);
    
    // Single Student Add States
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentNumber, setNewStudentNumber] = useState('');
    
    // UI/API States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Bulk Add States
    const [showScanner, setShowScanner] = useState(false);
    const [pendingStudents, setPendingStudents] = useState([]);

    // Delete Modal State
    const [studentToDelete, setStudentToDelete] = useState(null);
    // Student Profile Modal State
    const [selectedStudentId, setSelectedStudentId] = useState(null); // Added state

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await studentApi.getAll();
            setStudents(res.data);
            setError('');
        } catch (err) {
            setError('Öğrenciler yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        if (!newStudentName.trim()) return;

        try {
            setLoading(true);
            await studentApi.create({ 
                fullName: newStudentName,
                studentNumber: newStudentNumber
            });
            setNewStudentName('');
            setNewStudentNumber('');
            await fetchStudents();
            setError('');
            setSuccessMessage('Öğrenci başarıyla eklendi.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Öğrenci eklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSave = async () => {
        if (pendingStudents.length === 0) return;

        try {
            setLoading(true);
            await studentApi.createMany({ students: pendingStudents });
            setPendingStudents([]); // Clear the list after successful save
            await fetchStudents();
            setError('');
            setSuccessMessage('Toplu öğrenci ekleme işlemi başarılı.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Toplu ekleme sırasında hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const updatePendingStudent = (index, field, value) => {
        const newArr = [...pendingStudents];
        newArr[index][field] = value;
        setPendingStudents(newArr);
    };

    const removePendingStudent = (index) => {
        const newArr = pendingStudents.filter((_, i) => i !== index);
        setPendingStudents(newArr);
    };

    const handleDelete = (student) => {
        setStudentToDelete(student);
    };

    const confirmDelete = async (returnBooks = true) => {
        if (!studentToDelete) return;

        try {
            setLoading(true);
            await studentApi.delete(studentToDelete.id, { returnBooks });
            await fetchStudents();
            setError('');
            setSuccessMessage('Öğrenci başarıyla silindi.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Öğrenci silinemedi.');
        } finally {
            setLoading(false);
            setStudentToDelete(null);
        }
    };

    const handleDownloadStudentReport = async (studentId) => {
        try {
            const res = await reportApi.getStudentReport(studentId);
            generateStudentPdf(res.data);
        } catch (err) {
            setError('Rapor oluşturulurken hata oluştu.');
        }
    };

    const handleDownloadClassReport = async () => {
        try {
            setLoading(true);
            const res = await reportApi.getClassReport();
            generateClassPdf(res.data);
        } catch (err) {
            setError('Sınıf raporu oluşturulurken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Öğrenci Yönetimi</h1>
                    <p className="text-muted-foreground mt-1">Mevcut öğrencileri yönetin ve yeni kayıt oluşturun.</p>
                </div>
                <button
                    onClick={handleDownloadClassReport}
                    disabled={loading || students.length === 0}
                    title="Tüm sınıfın okuma raporunu PDF olarak indir"
                    className="btn-secondary"
                >
                    <FileDown size={16} /> Sınıf Raporu İndir
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm flex items-center shadow-sm">
                    <span className="font-semibold mr-2 flex items-center gap-1"><AlertCircle size={16}/> Hata:</span> {error}
                </div>
            )}
            
            {successMessage && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-200 text-sm flex items-center shadow-sm">
                    <span className="font-semibold mr-2 flex items-center gap-1"><CheckCircle2 size={16}/> Başarılı:</span> {successMessage}
                </div>
            )}

            {/* Pending Students Review UI */}
            {pendingStudents.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-500/30 rounded-xl overflow-hidden shadow-sm xl:col-span-3">
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 border-b border-indigo-100 dark:border-indigo-500/20 flex justify-between items-center">
                        <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                            <CheckCircle2 size={18} /> Tarama Tamamlandı: Lütfen listeyi gözden geçirin ({pendingStudents.length} Kayıt)
                        </h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPendingStudents([])} 
                                className="btn-secondary py-1.5 px-4"
                            >
                                İptal
                            </button>
                            <button 
                                onClick={handleBulkSave} 
                                disabled={loading}
                                className="btn-primary py-1.5 px-4"
                            >
                                {loading ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-sm text-left align-middle border-collapse">
                            <thead className="bg-muted/50 sticky top-0 z-10 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-foreground w-24">Öğrenci No</th>
                                    <th className="px-4 py-3 font-semibold text-foreground">Ad Soyad</th>
                                    <th className="px-4 py-3 font-semibold text-foreground w-16 text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {pendingStudents.map((student, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-2">
                                            <input 
                                                className="input-field py-1 px-2 h-auto text-sm" 
                                                value={student.studentNumber || ''} 
                                                onChange={(e) => updatePendingStudent(idx, 'studentNumber', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input 
                                                className="input-field py-1 px-2 h-auto text-sm" 
                                                value={student.fullName || ''} 
                                                onChange={(e) => updatePendingStudent(idx, 'fullName', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button 
                                                onClick={() => removePendingStudent(idx)} 
                                                className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-500/10 transition"
                                                title="Satırı Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Form Kartı */}
                <div className="md:col-span-1">
                    <div className="glass-panel p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                                <UserPlus size={20} className="text-primary" /> Yeni Öğrenci
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/20"
                                title="Sınıf Listesini Kamerayla Tara"
                            >
                                <ScanText size={14} /> Liste Tara
                            </button>
                        </div>

                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Öğrenci No (İsteğe bağlı)
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Örn: 154"
                                    value={newStudentNumber}
                                    onChange={(e) => setNewStudentNumber(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Ad Soyad
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Örn: Ali Yılmaz"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-primary w-full"
                                disabled={loading || !newStudentName.trim()}
                            >
                                {loading ? 'Ekleniyor...' : 'Öğrenci Ekle'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Liste Kartı */}
                <div className="md:col-span-2">
                    <div className="glass-panel overflow-hidden">

                        <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center">
                            <h3 className="font-semibold text-foreground">Kayıtlı Öğrenciler</h3>
                            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {students.length} Kişi
                            </span>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto p-0">
                            {students.length === 0 && !loading ? (
                                <div className="p-8 text-center text-muted-foreground">Henüz hiç öğrenci yok.</div>
                            ) : (
                                <ul className="divide-y divide-[color:var(--border)]">
                                    {students.map(student => (
                                        <li key={student.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group">

                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold cursor-pointer hover:bg-indigo-200 transition-colors"
                                                    onClick={() => setSelectedStudentId(student.id)}
                                                >
                                                    {student.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                            {student.studentNumber ? `#${student.studentNumber}` : 'No Yok'}
                                                        </span>
                                                        <h4 
                                                            className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                                                            onClick={() => setSelectedStudentId(student.id)}
                                                        >
                                                            {student.fullName}
                                                        </h4>
                                                    </div>
                                                    
                                                    {student.currentBooks && student.currentBooks.length > 0 && (
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <div className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-2.5 py-1 rounded-lg border border-border shadow-sm text-[11px] font-medium transition-all group-hover:border-primary/50">
                                                                <BookIcon size={12} className="text-primary" />
                                                                <span className="font-bold opacity-75">No:{student.currentBooks[0].labelNumber}</span>
                                                                <span className="h-2 w-[1px] bg-border"></span>
                                                                <span className="italic truncate max-w-[150px] sm:max-w-[250px]">"{student.currentBooks[0].title || 'İsimsiz'}"</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 sm:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleDownloadStudentReport(student.id)}
                                                    className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                    title="Okuma raporunu indir"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student)}
                                                    className="btn-destructive p-2"
                                                    title="Sil"
                                                    disabled={loading}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                    </div>
                </div>

            </div>

            {/* OCR Scanner Modal */}
            {showScanner && (
                <OCRScanner 
                    onScanComplete={(data) => {
                        setPendingStudents(data);
                        setShowScanner(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    onClose={() => setShowScanner(false)} 
                />
            )}

            {/* Delete Confirmation Modal */}
            <DeleteStudentModal 
                student={studentToDelete}
                loading={loading}
                onClose={() => setStudentToDelete(null)}
                onConfirm={confirmDelete}
            />

            {/* Student Profile Modal */}
            {selectedStudentId && (
                <StudentProfileModal 
                    studentId={selectedStudentId}
                    onClose={() => setSelectedStudentId(null)}
                />
            )}

        </div>
    );
};

export default Students;
