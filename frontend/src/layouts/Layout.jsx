import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { BookOpen, Users, LayoutDashboard, History, Settings, Repeat2, Menu, X } from 'lucide-react';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const menuItems = [
        { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { title: 'Dağıtım Yap', path: '/distribute', icon: <Repeat2 size={20} /> },
        { title: 'Öğrenciler', path: '/students', icon: <Users size={20} /> },
        { title: 'Kitaplar', path: '/books', icon: <BookOpen size={20} /> },
        { title: 'Geçmiş', path: '/history', icon: <History size={20} /> },
        { title: 'Ayarlar', path: '/settings', icon: <Settings size={20} /> }
    ];

    // Close sidebar when a menu item is clicked (mobile)
    const handleNavClick = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="flex h-screen bg-[color:var(--background)]">

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-[color:var(--card)] border-r border-[color:var(--border)] flex flex-col shadow-sm
                transform transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex items-center justify-between border-b border-[color:var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="bg-[color:var(--primary)] text-white p-2 rounded-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">Kitap Dağıtım</h1>
                            <p className="text-xs text-slate-500">Akıllı Sınıf Kütüphanesi</p>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
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
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Top Header */}
                <header className="h-16 bg-[color:var(--background)]/80 backdrop-blur-sm border-b border-[color:var(--border)] flex items-center px-4 lg:px-8 z-10 sticky top-0 gap-4">
                    {/* Hamburger menu button for mobile */}
                    <button
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={22} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                        Yönetim Paneli
                    </h2>
                </header>

                {/* Dynamic Route Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 page-fade-enter-active">
                    <Outlet />
                </div>
            </main>

        </div>
    );
};

export default Layout;
