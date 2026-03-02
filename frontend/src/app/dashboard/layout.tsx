'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface NavItem {
    href: string;
    icon: string;
    label: string;
    badge?: number;
}

const navItems: NavItem[] = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/dashboard/search', icon: '🔍', label: 'Recherche YouTube' },
    { href: '/dashboard/videos', icon: '🎬', label: 'Mes Vidéos' },
    { href: '/dashboard/pipeline', icon: '⚡', label: 'Pipeline IA' },
    { href: '/dashboard/tiktok', icon: '📱', label: 'TikTok' },
    { href: '/dashboard/analytics', icon: '📈', label: 'Analytics' },
    { href: '/dashboard/settings', icon: '⚙️', label: 'Paramètres' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/login');
            return;
        }
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <Link href="/dashboard" className="logo">
                        <div className="logo-icon">🚀</div>
                        <span className="logo-text">ViralBot</span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <span className="nav-section-label">Navigation</span>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                        >
                            <span style={{ fontSize: '18px' }}>{item.icon}</span>
                            <span>{item.label}</span>
                            {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                        </Link>
                    ))}

                    <span className="nav-section-label" style={{ marginTop: '8px' }}>Workflow</span>
                    <Link href="/dashboard/workflow" className={`nav-item ${pathname === '/dashboard/workflow' ? 'active' : ''}`}>
                        <span style={{ fontSize: '18px' }}>🔄</span>
                        <span>Automatisation n8n</span>
                    </Link>
                    <Link href="/dashboard/accounts" className={`nav-item ${pathname === '/dashboard/accounts' ? 'active' : ''}`}>
                        <span style={{ fontSize: '18px' }}>👤</span>
                        <span>Comptes</span>
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    {user && (
                        <div className="user-card" onClick={handleLogout} title="Cliquer pour déconnexion">
                            <div className="user-avatar">
                                {user.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="user-info">
                                <div className="user-name">{user.username}</div>
                                <div className="user-role">{user.role || 'Admin'} · Déconnexion</div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
