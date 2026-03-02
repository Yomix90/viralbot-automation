'use client';

import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        email: '',
        password: '',
        username: '',
        full_name: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let res;
            if (isLogin) {
                res = await authAPI.login(form.email, form.password);
            } else {
                res = await authAPI.register(form);
            }
            localStorage.setItem('access_token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success('🚀 Bienvenue sur ViralBot!');
            router.push('/dashboard');
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Erreur d\'authentification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg" />

            {/* Animated background elements */}
            <div style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
            }}>
                {['🚀', '🔥', '🎬', '📱', '⚡', '🎯'].map((emoji, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        fontSize: '40px',
                        opacity: 0.04,
                        top: `${10 + i * 15}%`,
                        left: `${5 + i * 15}%`,
                        transform: `rotate(${i * 20}deg)`,
                    }}>
                        {emoji}
                    </div>
                ))}
            </div>

            <div className="auth-card">
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #ff0050 0%, #8b5cf6 50%, #3b82f6 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        margin: '0 auto 16px',
                        boxShadow: '0 0 40px rgba(255,0,80,0.3)',
                    }}>
                        🚀
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                        <span className="gradient-text">ViralBot</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                        Pipeline d'automatisation vidéo viral
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="tabs" style={{ marginBottom: '28px' }}>
                    <button className={`tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>
                        Connexion
                    </button>
                    <button className={`tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>
                        Inscription
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <div className="input-group">
                                <label className="input-label">Nom d'utilisateur</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="viralcreator"
                                    value={form.username}
                                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Nom complet</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Jean Dupont"
                                    value={form.full_name}
                                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                                />
                            </div>
                        </>
                    )}

                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                            className="input"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '24px' }}>
                        <label className="input-label">Mot de passe</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <><span className="spinner" /> {isLogin ? 'Connexion...' : 'Inscription...'}</>
                        ) : (
                            isLogin ? '🚀 Se Connecter' : '✨ Créer mon compte'
                        )}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {isLogin ? 'Pas encore de compte?' : 'Déjà un compte?'}{' '}
                    <button
                        style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Créer un compte' : 'Se connecter'}
                    </button>
                </p>
            </div>
        </div>
    );
}
