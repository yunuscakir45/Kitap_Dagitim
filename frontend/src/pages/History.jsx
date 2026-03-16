import React, { useState, useEffect } from 'react';
import { distributionApi, studentApi, reportApi } from '../api';
import { History as HistoryIcon, RotateCcw, Search, Calendar, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { generateStudentPdf } from '../utils/pdfGenerator';

const History = () => {
    const [distributions, setDistributions] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentHistory, setStudentHistory] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedDistIds, setExpandedDistIds] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [distRes, stuRes] = await Promise.all([
                distributionApi.getAll(),
                studentApi.getAll()
            ]);
            setDistributions(distRes.data);
            setStudents(stuRes.data);
            setError('');
        } catch (err) {
            setError('Geçmiş veriler yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleStudentSelect = async (e) => {
        const studentId = e.target.value;
        setSelectedStudentId(studentId);

        if (!studentId) {
            setStudentHistory(null);
            return;
        }

        try {
            setLoading(true);
            const res = await distributionApi.getStudentHistory(studentId);
            setStudentHistory(res.data);
        } catch (err) {
            setError('Öğrenci okuma geçmişi getirilemedi.');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedDistIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleUndo = async (id) => {
        if (!window.confirm('Bu dağıtımı geri almak istediğinize emin misiniz? Bu işlem, kitapları dağıtımdan önceki sahiplerine iade eder ve geçmişi temizler.')) return;

        try {
            setLoading(true);
            await distributionApi.undo(id);

            // Verileri yenile
            await fetchData();
            if (selectedStudentId) {
                const res = await distributionApi.getStudentHistory(selectedStudentId);
                setStudentHistory(res.data);
            }
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Dağıtım geri alınamadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">İşlem Geçmişi</h1>
                    <p className="text-muted-foreground text-sm mt-1">Önceki dağıtımları inceleyin veya öğrenci bazlı geçmişe bakın.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center shadow-sm text-sm">
                    <span className="font-semibold mr-2">Hata:</span> {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Öğrenci Okuma Geçmişi */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-6 sticky top-24">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-4 text-foreground border-b border-border pb-3">
                            <Search size={18} className="text-primary" /> Öğrenci Ara
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Öğrenci Seçin
                            </label>
                            <select
                                className="input-field"
                                value={selectedStudentId}
                                onChange={handleStudentSelect}
                                disabled={loading}
                            >
                                <option value="">-- Öğrenci Seç --</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.fullName}</option>
                                ))}
                            </select>
                        </div>

                        {studentHistory && (
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Okuduğu Kitaplar</h4>
                                    {studentHistory.length > 0 && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await reportApi.getStudentReport(selectedStudentId);
                                                    generateStudentPdf(res.data);
                                                } catch (err) {
                                                    setError('Rapor indirilemedi.');
                                                }
                                            }}
                                            className="btn-secondary py-1.5 px-2.5 text-xs"
                                            title="PDF olarak indir"
                                        >
                                            <Download size={12} /> PDF
                                        </button>
                                    )}
                                </div>
                                {studentHistory.length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-300 italic">Henüz okuduğu kitap yok.</p>
                                ) : (
                                    <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {studentHistory.map(history => (
                                            <li key={history.id} className="p-3 bg-muted/30 rounded-lg border border-border">
                                                <div className="flex items-center gap-2 font-medium text-foreground">
                                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">A</span>
                                                    Kitap #{history.book?.labelNumber || '?'}
                                                    <span className="text-muted-foreground font-normal italic ml-1">"{history.book?.title || 'İsimsiz'}"</span>
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(history.readAt).toLocaleDateString('tr-TR')}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Genel Dağıtım Listesi */}
                <div className="lg:col-span-2">
                    <div className="glass-panel overflow-hidden">
                        <div className="p-5 border-b border-border bg-muted/50 flex justify-between items-center">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <HistoryIcon size={18} className="text-primary" /> Tüm Dağıtımlar
                            </h3>
                            <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                {distributions.length} Kayıt
                            </span>
                        </div>

                        <div className="divide-y divide-border">
                            {distributions.length === 0 && !loading ? (
                                <div className="p-8 text-center text-muted-foreground">Geçmişte yapılmış bir dağıtım yok.</div>
                            ) : (
                                distributions.map(dist => {
                                    const isExpanded = expandedDistIds.includes(dist.id);
                                    return (
                                        <div key={dist.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                                            {/* Header */}
                                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="cursor-pointer flex-1" onClick={() => toggleExpand(dist.id)}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-foreground">
                                                            {new Date(dist.distributedAt).toLocaleString('tr-TR')}
                                                        </span>
                                                        {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        Not: {dist.note || 'Yok'} • <span className="text-primary font-semibold">{dist.items?.length || 0} Kitap dağıtıldı</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleUndo(dist.id)}
                                                    className="btn-secondary text-red-500 border-red-500/20 hover:bg-red-500/10 flex gap-2 items-center"
                                                    disabled={loading}
                                                    title="Bu dağıtımı geri al"
                                                >
                                                    <RotateCcw size={16} /> <span className="sm:hidden lg:inline">Geri Al</span>
                                                </button>
                                            </div>

                                            {/* Details */}
                                            {isExpanded && (
                                                <div className="p-4 bg-muted/30 border-t border-border">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                                            <tr>
                                                                <th className="px-4 py-2 rounded-l-md">Kitap</th>
                                                                <th className="px-4 py-2">Eski Sahibi</th>
                                                                <th className="px-4 py-2 rounded-r-md">Yeni Sahibi (Alan)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {dist.items?.map(item => (
                                                                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                                                    <td className="px-4 py-2 font-medium">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs text-muted-foreground">No: {item.book?.labelNumber}</span>
                                                                            <span className="font-semibold text-foreground">"{item.book?.title || 'İsimsiz'}"</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-muted-foreground">{item.fromStudent?.fullName || <span className="italic text-xs">Yok (Yeni kitap)</span>}</td>
                                                                    <td className="px-4 py-2 font-medium text-emerald-600 dark:text-emerald-400">{item.toStudent?.fullName}</td>
                                                                </tr>
                                                            ))}
                                                            {(!dist.items || dist.items.length === 0) && (
                                                                <tr>
                                                                    <td colSpan="3" className="px-4 py-4 text-center text-slate-500 italic">Eşleşme detayı bulunamadı.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default History;
