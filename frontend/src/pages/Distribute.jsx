import React, { useState, useEffect } from 'react';
import { studentApi, distributionApi, bookApi } from '../api';
import { Users, AlertCircle, ArrowRight, CheckCircle2, UserX, BookX, Trash2, Book as BookIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Distribute = () => {
    const [students, setStudents] = useState([]);
    const [books, setBooks] = useState([]); // Book lookup for results
    const [attendance, setAttendance] = useState({}); // { studentId: 'PRESENT' | 'ABSENT' | 'NO_BOOK' | 'LOST_BOOK' }
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successResult, setSuccessResult] = useState(null);
    const [sortBy, setSortBy] = useState('BOOK'); // 'BOOK' or 'STUDENT'

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [studentsRes, booksRes] = await Promise.all([
                studentApi.getAll(),
                bookApi.getAll()
            ]);
            
            setStudents(studentsRes.data);
            setBooks(booksRes.data);

            const initialAttendance = {};
            studentsRes.data.forEach(s => {
                initialAttendance[s.id] = 'PRESENT';
            });
            setAttendance(initialAttendance);

            if (studentsRes.data.length === 0) {
                setError('Dağıtım yapabilmek için sınıfta en az bir öğrenci bulunmalıdır.');
            }
        } catch (err) {
            setError('Veriler yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = fetchData; // For compatibility if called elsewhere

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleRunDistribution = async () => {
        if (students.length === 0) return;

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
                    <h2 className="text-3xl font-bold text-foreground">Dağıtım Başarılı</h2>
                    <p className="text-muted-foreground mt-2">Kitaplar belirtilen algoritmaya göre başarıyla dağıtıldı.</p>
                </div>

                <div className="glass-panel p-6">
                    <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
                        <h3 className="font-semibold text-lg text-foreground">Yeni Eşleşmeler</h3>
                        <div className="flex bg-muted p-0.5 rounded-lg border border-border text-[11px] font-bold uppercase tracking-tight">
                            <button 
                                onClick={() => setSortBy('BOOK')}
                                className={`px-2.5 py-1 rounded-md transition-all ${sortBy === 'BOOK' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
                            >
                                Kitap No
                            </button>
                            <button 
                                onClick={() => setSortBy('STUDENT')}
                                className={`px-2.5 py-1 rounded-md transition-all ${sortBy === 'STUDENT' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
                            >
                                Öğrenci
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {Object.keys(successResult.matches)
                            .sort((a, b) => {
                                if (sortBy === 'BOOK') {
                                    const b1 = books.find(book => book.id === successResult.matches[a]);
                                    const b2 = books.find(book => book.id === successResult.matches[b]);
                                    return (b1?.labelNumber || '').localeCompare(b2?.labelNumber || '', undefined, { numeric: true, sensitivity: 'base' });
                                } else {
                                    const s1 = students.find(s => s.id === parseInt(a));
                                    const s2 = students.find(s => s.id === parseInt(b));
                                    return (s1?.fullName || '').localeCompare(s2?.fullName || '');
                                }
                            })
                            .map((studentIdStr, index) => {
                            const bookId = successResult.matches[studentIdStr];
                            const student = students.find(s => s.id === parseInt(studentIdStr));
                            const book = books.find(b => b.id === bookId) || { labelNumber: bookId, title: 'Bilinmeyen Kitap' };

                            return (
                                <div key={studentIdStr} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/50 border border-border gap-3">
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-muted-foreground/30 text-lg">#{index + 1}</span>
                                        <div className="font-semibold text-foreground">{student?.fullName || 'Bilinmeyen'}</div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <ArrowRight size={16} className="text-muted-foreground hidden sm:block" />
                                        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 shadow-sm transition-all hover:shadow-md">
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-60">No:{book.labelNumber}</span>
                                            <span className="h-3 w-[1px] bg-primary/30 mx-0.5"></span>
                                            <span className="font-medium text-sm italic">"{book.title}"</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 flex gap-4 justify-center">
                        <button onClick={() => navigate('/history')} className="btn-secondary">Geçmişe Git</button>
                        <button onClick={() => { setSuccessResult(null); fetchData(); setNote(''); }} className="btn-primary">Yeni Dağıtım</button>
                    </div>
                </div>
            </div>
        );
    }

    // Dağıtım öncesi form ekranı
    return (
        <div className="max-w-4xl mx-auto space-y-6">

            <div>
                <h1 className="text-4xl font-black text-foreground tracking-tight">Yeni Dağıtım Başlat</h1>
                <p className="text-muted-foreground mt-1">Önce öğrencilerin bugünkü durumlarını belirleyin.</p>
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
                <div className="p-5 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Users size={18} className="text-primary" /> Sınıf Yoklaması
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded"><CheckCircle2 size={12} /> Mevcut</span>
                        <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded"><UserX size={12} /> Yok</span>
                        <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded"><BookX size={12} /> Kitapsız</span>
                        <span className="flex items-center gap-1 bg-slate-200 text-slate-700 px-2 py-1 rounded"><Trash2 size={12} /> Kitabı Kaybetti</span>
                    </div>
                </div>

                <div className="p-0">
                    {students.length === 0 && !loading ? (
                        <div className="p-8 text-center text-slate-500">Öğrenci bulunamadı.</div>
                    ) : (
                        <div className="divide-y divide-[color:var(--border)]">
                            {students.map(student => (
                                <div key={student.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <div className="font-semibold text-foreground flex items-center gap-2">
                                            {student.fullName}
                                            {student.studentNumber && (
                                                <span className="text-[10px] text-muted-foreground font-normal">#{student.studentNumber}</span>
                                            )}
                                        </div>
                                        {student.currentBooks && student.currentBooks.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-2.5 py-1 rounded-lg border border-border shadow-sm text-[11px] font-medium transition-all group-hover:border-primary/50">
                                                    <BookIcon size={12} className="text-primary" />
                                                    <span className="font-bold opacity-75">No:{student.currentBooks[0].labelNumber}</span>
                                                    <span className="h-2 w-[1px] bg-border"></span>
                                                    <span className="italic truncate max-w-[150px] sm:max-w-[250px]">"{student.currentBooks[0].title || 'İsimsiz'}"</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex bg-muted rounded-lg p-1 self-start md:self-auto overflow-x-auto shadow-inner border border-border">
                                        <button
                                            type="button"
                                            onClick={() => handleStatusChange(student.id, 'PRESENT')}
                                            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${attendance[student.id] === 'PRESENT' ? 'bg-card text-emerald-600 shadow-sm' : 'text-muted-foreground hover:text-emerald-500'}`}
                                        >
                                            Geldi
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleStatusChange(student.id, 'ABSENT')}
                                            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${attendance[student.id] === 'ABSENT' ? 'bg-card text-red-600 shadow-sm' : 'text-muted-foreground hover:text-red-500'}`}
                                        >
                                            Yok
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleStatusChange(student.id, 'NO_BOOK')}
                                            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${attendance[student.id] === 'NO_BOOK' ? 'bg-card text-amber-600 shadow-sm' : 'text-muted-foreground hover:text-amber-500'}`}
                                        >
                                            Kitapsız
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!student.currentBooks || student.currentBooks.length === 0}
                                            onClick={() => handleStatusChange(student.id, 'LOST_BOOK')}
                                            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed ${attendance[student.id] === 'LOST_BOOK' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                                            title={(!student.currentBooks || student.currentBooks.length === 0) ? "Öğrencinin zaten kitabı yok" : "Kitabı kaybettiğini işaretle"}
                                        >
                                            Kaybetti
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {students.length > 0 && (
                    <div className="p-5 border-t border-border bg-muted/30 space-y-4">
                        <div className="max-w-md">
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                                Dağıtım Notu (İsteğe bağlı)
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Örn: 3. Hafta Dağıtımı"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button
                            onClick={handleRunDistribution}
                            disabled={loading}
                            className="btn-primary px-8 py-2.5 flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Hesaplanıyor...
                                </>
                            ) : 'Dağıt'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Distribute;
