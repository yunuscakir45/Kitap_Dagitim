import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BookOpen, Users, LayoutDashboard, History, Settings, Repeat2 } from 'lucide-react';

const Layout = () => {
    const menuItems = [
        { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { title: 'Dağıtım Yap', path: '/distribute', icon: <Repeat2 size={20} /> },
        { title: 'Öğrenciler', path: '/students', icon: <Users size={20} /> },
        { title: 'Kitaplar', path: '/books', icon: <BookOpen size={20} /> },
        { title: 'Geçmiş', path: '/history', icon: <History size={20} /> },
        { title: 'Ayarlar', path: '/settings', icon: <Settings size={20} /> }
    ];

    return (
        <div className="flex h-screen bg-[color:var(--background)]">

            {/* Sidebar */}
            <aside className="w-64 bg-[color:var(--card)] border-r border-[color:var(--border)] flex flex-col shadow-sm">
                <div className="p-6 flex items-center gap-3 border-b border-[color:var(--border)]">
                    <div className="bg-[color:var(--primary)] text-white p-2 rounded-lg">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">Kitap Dağıtım</h1>
                        <p className="text-xs text-slate-500">Akıllı Sınıf Kütüphanesi</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-[color:var(--primary)] text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="font-medium">{item.title}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-[color:var(--border)] text-xs text-center text-slate-500">
                    V1.0.0
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-[color:var(--background)]/80 backdrop-blur-sm border-b border-[color:var(--border)] flex items-center px-8 z-10 sticky top-0">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                        Yönetim Paneli
                    </h2>
                </header>

                {/* Dynamic Route Content */}
                <div className="flex-1 overflow-y-auto p-8 page-fade-enter-active">
                    <Outlet />
                </div>
            </main>

        </div>
    );
};

export default Layout;
