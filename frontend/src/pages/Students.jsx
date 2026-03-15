import React, { useState, useEffect } from 'react';
import { studentApi, reportApi } from '../api';
import { UserPlus, Trash2, BookUser, ScanText, CheckCircle2, AlertCircle, Download, FileDown } from 'lucide-react';
import OCRScanner from '../components/OCRScanner';
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

    const handleDelete = async (id) => {
        if (!window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) return;

        try {
            setLoading(true);
            await studentApi.delete(id);
            await fetchStudents();
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Öğrenci silinemedi. Elinde kitap olabilir.');
        } finally {
            setLoading(false);
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
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Öğrenci Yönetimi</h1>
                    <p className="text-slate-500 text-sm mt-1">Sınıftaki öğrencileri ekleyin veya çıkarın.</p>
                </div>
                <button
                    onClick={handleDownloadClassReport}
                    disabled={loading || students.length === 0}
                    className="flex items-center gap-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                    title="Tüm sınıfın okuma raporunu PDF olarak indir"
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
                                className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                            >
                                İptal
                            </button>
                            <button 
                                onClick={handleBulkSave} 
                                disabled={loading}
                                className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                            >
                                {loading ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-sm text-left align-middle border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 w-24">Öğrenci No</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Ad Soyad</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 w-16 text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {pendingStudents.map((student, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
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
                                                className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition"
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
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                <UserPlus size={20} className="text-indigo-500" /> Yeni Öğrenci
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
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
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
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
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

                        <div className="p-4 border-b border-[color:var(--border)] bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Kayıtlı Öğrenciler</h3>
                            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                {students.length} Kişi
                            </span>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto p-0">
                            {students.length === 0 && !loading ? (
                                <div className="p-8 text-center text-slate-500">Henüz hiç öğrenci yok.</div>
                            ) : (
                                <ul className="divide-y divide-[color:var(--border)]">
                                    {students.map(student => (
                                        <li key={student.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group">

                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                    {student.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                                            {student.studentNumber ? `#${student.studentNumber}` : 'No Yok'}
                                                        </span>
                                                        <h4 className="font-medium text-slate-800 dark:text-slate-200">
                                                            {student.fullName}
                                                        </h4>
                                                    </div>
                                                    
                                                    {student.currentBooks && student.currentBooks.length > 0 && (
                                                        <p className="text-xs text-indigo-600 flex items-center gap-1 mt-1 font-medium">
                                                            <BookUser size={12} /> Elinde {student.currentBooks[0].labelNumber} no'lu kitap var
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleDownloadStudentReport(student.id)}
                                                    className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                    title="Okuma raporunu indir"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student.id)}
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

        </div>
    );
};

export default Students;
