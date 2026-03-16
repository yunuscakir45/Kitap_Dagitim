import React, { useState, useEffect } from 'react';
import { 
    X, Book, Calendar, AlertTriangle, Clock, 
    ArrowRight, CheckCircle2, History, User, Hash
} from 'lucide-react';
import { studentApi } from '../api';

const StudentProfileModal = ({ studentId, onClose }) => {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (studentId) {
            fetchStudentDetails();
        }
    }, [studentId]);

    const fetchStudentDetails = async () => {
        try {
            setLoading(true);
            const res = await studentApi.getById(studentId);
            setStudent(res.data);
        } catch (err) {
            setError('Öğrenci bilgileri yüklenirken bir hata oluştu.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!studentId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-border glass-panel">
                
                {/* Header */}
                <div className="relative p-6 sm:p-8 border-b border-border bg-gradient-to-r from-primary/5 to-purple-500/10">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <User size={40} />
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                                {loading ? 'Yükleniyor...' : student?.fullName}
                            </h2>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2 text-muted-foreground text-sm">
                                <span className="flex items-center gap-1.5"><Hash size={14} /> No: {student?.studentNumber || '-'}</span>
                                <span className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${student?.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    {student?.isActive ? 'Aktif Öğrenci' : 'Pasif Öğrenci'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-muted-foreground animate-pulse">Profil verileri hazırlanıyor...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10">
                            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                            <p className="text-slate-800 dark:text-white font-medium">{error}</p>
                            <button onClick={fetchStudentDetails} className="mt-4 btn-primary">Tekrar Dene</button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard 
                                    icon={<Book className="text-blue-500" />} 
                                    label="Toplam Okunan" 
                                    value={student.stats.totalBooksRead} 
                                    subLabel="Kitap"
                                />
                                <StatCard 
                                    icon={<AlertTriangle className="text-amber-500" />} 
                                    label="Kaybedilen" 
                                    value={student.stats.lostBooksCount} 
                                    subLabel="Adet"
                                />
                                <StatCard 
                                    icon={<Clock className="text-primary" />} 
                                    label="İlk Alma" 
                                    value={student.stats.firstLibraryVisit ? new Date(student.stats.firstLibraryVisit).toLocaleDateString('tr-TR') : '-'} 
                                    subLabel="Tarih"
                                />
                                <StatCard 
                                    icon={<Calendar className="text-emerald-500" />} 
                                    label="Son Alma" 
                                    value={student.stats.lastLibraryVisit ? new Date(student.stats.lastLibraryVisit).toLocaleDateString('tr-TR') : '-'} 
                                    subLabel="Tarih"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Reading History timeline */}
                                <div className="lg:col-span-2 space-y-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-4">
                                        <History size={20} className="text-primary" /> Okuma Geçmişi
                                    </h3>
                                    
                                    {student.readingHistory.length === 0 ? (
                                        <div className="bg-muted/30 p-8 rounded-2xl text-center text-muted-foreground border border-dashed border-border">
                                            Henüz okuma kaydı bulunmuyor.
                                        </div>
                                    ) : (
                                        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-purple-500 before:to-transparent">
                                            {student.readingHistory.map((item, index) => (
                                                <div key={item.id} className="relative pl-12 group">
                                                    <div className="absolute left-0 top-1 w-10 h-10 bg-card border-4 border-primary rounded-full flex items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-md">
                                                        <CheckCircle2 size={16} className="text-primary" />
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border hover:border-primary/50 transition-colors shadow-sm">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div className="font-semibold text-foreground">
                                                                {item.book.title} ({item.book.labelNumber})
                                                            </div>
                                                            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                                                                {formatDate(item.readAt)}
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 text-xs text-primary flex items-center gap-1">
                                                            <ArrowRight size={12} /> {item.distribution?.note || 'Düzenli Dağıtım'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar info: Lost Books & Current */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-4">
                                            <Book size={20} className="text-emerald-500" /> Şu An Elinde
                                        </h3>
                                        {student.currentBooks.length === 0 ? (
                                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 text-amber-600 text-sm border border-amber-200/50">
                                                Öğrencinin elinde şu an kitap bulunmuyor.
                                            </div>
                                        ) : (
                                            student.currentBooks.map(book => (
                                                <div key={book.id} className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 flex items-center gap-3">
                                                    <div className="bg-emerald-500 text-white p-2 rounded-xl">
                                                        <Book size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-emerald-800 dark:text-emerald-400">{book.labelNumber}</div>
                                                        <div className="text-xs text-emerald-600/70">{book.title}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {student.lostBooks.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-4">
                                                <AlertTriangle size={20} className="text-red-500" /> Kaybedilen Kitaplar
                                            </h3>
                                            <div className="space-y-3">
                                                {student.lostBooks.map(book => (
                                                    <div key={book.id} className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200/50">
                                                        <div className="font-bold text-red-800 dark:text-red-400 flex justify-between items-center">
                                                            <span>{book.labelNumber}</span>
                                                            <span className="text-[10px] bg-red-200/50 dark:bg-red-800/50 px-2 py-0.5 rounded-full uppercase">Kayıp</span>
                                                        </div>
                                                        <div className="text-xs text-red-600/70 mb-2">{book.title}</div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                            <Clock size={10} /> {new Date(book.lostAt).toLocaleDateString('tr-TR')} tarihinde kaybedildi.
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/50 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="btn-secondary px-8"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, subLabel }) => (
    <div className="bg-muted/30 p-4 rounded-2xl border border-border hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-card rounded-xl shadow-sm border border-border">
                {icon}
            </div>
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">{value}</span>
            <span className="text-xs text-muted-foreground">{subLabel}</span>
        </div>
    </div>
);

export default StudentProfileModal;
