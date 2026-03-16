import React, { useState, useEffect } from 'react';
import { distributionApi, studentApi, bookApi } from '../api';
import { Users, BookOpen, Repeat2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalBooks: 0,
        totalDistributions: 0,
        latestDistribution: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [studentsRes, booksRes, distRes] = await Promise.all([
                studentApi.getAll(),
                bookApi.getAll(),
                distributionApi.getAll()
            ]);

            const dists = distRes.data;
            setStats({
                totalStudents: studentsRes.data.length,
                totalBooks: booksRes.data.length,
                totalDistributions: dists.length,
                latestDistribution: dists.length > 0 ? dists[0] : null
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, colorClass }) => (
        <div className="glass-panel p-6 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{title}</p>
                <h3 className="text-3xl font-black text-foreground leading-none">{value}</h3>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-4xl font-black text-foreground tracking-tight">Hoş Geldiniz</h1>
                <p className="text-muted-foreground mt-1">Sınıf kitaplık dağıtım sistemi genel durumu.</p>
            </div>

            {loading ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground">Yükleniyor...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="Aktif Öğrenci"
                            value={stats.totalStudents}
                            icon={<Users size={24} />}
                            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        />
                        <StatCard
                            title="Kayıtlı Kitap"
                            value={stats.totalBooks}
                            icon={<BookOpen size={24} />}
                            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        />
                        <StatCard
                            title="Toplam Dağıtım"
                            value={stats.totalDistributions}
                            icon={<Repeat2 size={24} />}
                            colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="glass-panel p-6">
                            <h3 className="font-semibold text-lg border-b border-[color:var(--border)] pb-3 mb-4">Hızlı Eylemler</h3>
                            <div className="space-y-3">
                                <Link to="/distribute" className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><Repeat2 size={18} /></div>
                                        <div className="font-medium">Yeni Dağıtım Başlat</div>
                                    </div>
                                    <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                </Link>

                                <Link to="/students" className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Users size={18} /></div>
                                        <div className="font-medium">Öğrenci Yönetimi</div>
                                    </div>
                                    <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </Link>
                            </div>
                        </div>

                        <div className="glass-panel p-6">
                            <h3 className="font-bold text-lg border-b border-border pb-3 mb-6 text-foreground">Son Dağıtım İşlemi</h3>
                            {stats.latestDistribution ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">İşlem Tarihi</p>
                                        <p className="text-lg font-bold text-foreground">
                                            {new Date(stats.latestDistribution.distributedAt).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Dağıtım Etkisi</p>
                                        <p className="text-lg font-bold text-primary">
                                            {stats.latestDistribution.items.length} Kitap el değiştirdi
                                        </p>
                                    </div>
                                    <Link to="/history">
                                        <button className="btn-secondary w-full">Tüm Dağıtım Geçmişini Gör</button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-center p-6 text-muted-foreground flex flex-col items-center">
                                    <Repeat2 size={32} className="opacity-20 mb-2" />
                                    <p>Henüz sistemde hiç dağıtım yapılmamış.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default Dashboard;
