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
        <div className="flex h-screen bg-background text-foreground">

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col shadow-2xl
                transform transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary text-white p-2 rounded-lg shadow-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight text-foreground">Kitap Dağıtım</h1>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Akıllı Kütüphane</p>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} className="text-muted-foreground" />
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
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'text-muted-foreground hover:bg-muted'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="font-semibold">{item.title}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-border text-[10px] font-bold text-center text-muted-foreground uppercase tracking-widest opacity-50">
                    V1.0.0
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Top Header */}
                <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center px-4 lg:px-8 z-10 sticky top-0 gap-4">
                    {/* Hamburger menu button for mobile */}
                    <button
                        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={22} className="text-muted-foreground" />
                    </button>
                    <h2 className="text-xl font-bold text-foreground">
                        Yönetim Paneli
                    </h2>
                </header>

                {/* Dynamic Route Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>

        </div>
    );
};

export default Layout;
