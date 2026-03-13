import React, { useState, useEffect } from 'react';
import { studentApi, distributionApi } from '../api';
import { Users, AlertCircle, ArrowRight, CheckCircle2, UserX, BookX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Distribute = () => {
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { studentId: 'PRESENT' | 'ABSENT' | 'NO_BOOK' }
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successResult, setSuccessResult] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await studentApi.getAll();
            setStudents(res.data);

            // Default olarak herkesi 'PRESENT' kabul et
            const initialAttendance = {};
            res.data.forEach(s => {
                initialAttendance[s.id] = 'PRESENT';
            });
            setAttendance(initialAttendance);

            if (res.data.length === 0) {
                setError('Dağıtım yapabilmek için sınıfta en az bir öğrenci bulunmalıdır.');
            }
        } catch (err) {
            setError('Öğrenciler yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleRunDistribution = async () => {
        if (students.length === 0) return;

        // API'nin beklediği formata dönüştür: [{studentId: 1, status: 'PRESENT'}, ...]
        const attendanceArray = Object.keys(attendance).map(id => ({
            studentId: parseInt(id),
            status: attendance[id]
        }));

        try {
            setLoading(true);
            setError('');
            setSuccessResult(null);

            const payload = { attendance: attendanceArray, note };
            const res = await distributionApi.run(payload);

            setSuccessResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Dağıtım algoritması çalıştırılırken bilinmeyen bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // Eğer dağıtım başarılı olduysa sonuç ekranını göster
    if (successResult) {
        return (
            <div className="max-w-3xl mx-auto space-y-6 page-fade-enter-active">
                <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Dağıtım Başarılı</h2>
                    <p className="text-slate-500 mt-2">Kitaplar belirtilen algoritmaya göre başarıyla dağıtıldı.</p>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="font-semibold text-lg border-b border-[color:var(--border)] pb-3 mb-4">Yeni Eşleşmeler</h3>

                    <div className="space-y-3">
                        {Object.keys(successResult.matches).map((studentIdStr, index) => {
                            const bookIdStr = successResult.matches[studentIdStr];
                            const student = students.find(s => s.id === parseInt(studentIdStr));

                            return (
                                <div key={studentIdStr} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-[color:var(--border)]">
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-slate-400 w-6">#{index + 1}</span>
                                        <div className="font-medium text-slate-800 dark:text-slate-200">{student?.fullName || 'Bilinmeyen'}</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-md">
                                        <ArrowRight size={16} /> Kitap ID: {bookIdStr}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 flex gap-4 justify-center">
                        <button onClick={() => navigate('/history')} className="btn-secondary">Geçmişe Git</button>
                        <button onClick={() => { setSuccessResult(null); fetchStudents(); setNote(''); }} className="btn-primary">Yeni Dağıtım</button>
                    </div>
                </div>
            </div>
        );
    }

    // Dağıtım öncesi form ekranı
    return (
        <div className="max-w-4xl mx-auto space-y-6">

            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Yeni Dağıtım Başlat</h1>
                <p className="text-slate-500 text-sm mt-1">Önce öğrencilerin bugünkü durumlarını belirleyin.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm flex items-start gap-3 shadow-sm">
                    <AlertCircle className="mt-0.5 shrink-0" size={18} />
                    <div>
                        <span className="font-semibold block mb-1">Dağıtım Başarısız:</span>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-[color:var(--border)] bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Users size={18} className="text-indigo-500" /> Sınıf Yoklaması
                    </h3>
                    <div className="flex gap-2 text-xs">
                        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded"><CheckCircle2 size={12} /> Mevcut</span>
                        <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded"><UserX size={12} /> Yok</span>
                        <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded"><BookX size={12} /> Kitapsız</span>
                    </div>
                </div>

                <div className="p-0">
                    {students.length === 0 && !loading ? (
                        <div className="p-8 text-center text-slate-500">Öğrenci bulunamadı.</div>
                    ) : (
                        <div className="divide-y divide-[color:var(--border)]">
                            {students.map(student => (
                                <div key={student.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <div className="font-medium text-slate-800 dark:text-slate-200">
                                        {student.fullName}
                                        {student.currentBooks && student.currentBooks.length > 0 && (
                                            <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                Kitap: {student.currentBooks[0].labelNumber}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 self-start md:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => handleStatusChange(student.id, 'PRESENT')}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${attendance[student.id] === 'PRESENT' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-emerald-500'}`}
                                        >
                                            Geldi
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleStatusChange(student.id, 'ABSENT')}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${attendance[student.id] === 'ABSENT' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-sm' : 'text-slate-500 hover:text-red-500'}`}
                                        >
                                            Yok
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleStatusChange(student.id, 'NO_BOOK')}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${attendance[student.id] === 'NO_BOOK' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-amber-500'}`}
                                        >
                                            Kitapsız
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {students.length > 0 && (
                    <div className="p-5 border-t border-[color:var(--border)] bg-slate-50 dark:bg-slate-800/50 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Dağıtım Notu (İsteğe bağlı)
                            </label>
                            <input
                                type="text"
                                className="input-field max-w-md"
                                placeholder="Örn: 3. Hafta Dağıtımı"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button
                            onClick={handleRunDistribution}
                            disabled={loading}
                            className="btn-primary w-full md:w-auto mt-4"
                        >
                            {loading ? 'Hesaplanıyor...' : 'Algoritmayı Çalıştır ve Dağıt'}
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Distribute;
