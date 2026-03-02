'use client';

import { useState, useEffect } from 'react';
import { tiktokAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TikTokPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [authUrl, setAuthUrl] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchAccounts = async () => {
        try {
            const res = await tiktokAPI.accounts();
            setAccounts(res.data.accounts);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getAuthUrl = async () => {
        try {
            const res = await tiktokAPI.getAuthUrl();
            setAuthUrl(res.data.auth_url);
        } catch (e) {
            toast.error('Erreur lors de la récupération de l\'URL d\'authentification');
        }
    };

    useEffect(() => {
        fetchAccounts();
        getAuthUrl();
    }, []);

    const handleDisconnect = async (id: number) => {
        if (!confirm('Déconnecter ce compte TikTok?')) return;
        try {
            await tiktokAPI.disconnectAccount(id);
            toast.success('Compte déconnecté');
            fetchAccounts();
        } catch (e) {
            toast.error('Erreur');
        }
    };

    return (
        <>
            <header className="header">
                <div>
                    <h1 className="header-title">📱 Comptes TikTok</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Gérez vos comptes TikTok pour la publication automatique
                    </p>
                </div>
                {authUrl && (
                    <a href={authUrl} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                        + Connecter un compte TikTok
                    </a>
                )}
            </header>

            <div className="page-content">
                {/* Info Banner */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(255,0,80,0.06), rgba(139,92,246,0.06))',
                    border: '1px solid rgba(255,0,80,0.15)',
                    borderRadius: 'var(--radius)',
                    padding: '20px 24px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                }}>
                    <div style={{ fontSize: '32px', flexShrink: 0 }}>📱</div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                            Comment connecter votre compte TikTok
                        </h3>
                        <ol style={{ color: 'var(--text-secondary)', fontSize: '14px', paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li>Cliquez sur "Connecter un compte TikTok"</li>
                            <li>Authentifiez-vous sur TikTok avec votre compte</li>
                            <li>Autorisez l'accès à l'application ViralBot</li>
                            <li>Votre compte apparaîtra dans la liste ci-dessous</li>
                        </ol>
                    </div>
                </div>

                {/* Accounts */}
                {loading ? (
                    <div className="grid-2">
                        {[1, 2].map(i => (
                            <div key={i} className="card">
                                <div className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
                            </div>
                        ))}
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">📱</div>
                            <div className="empty-state-title">Aucun compte connecté</div>
                            <div className="empty-state-text">
                                Connectez votre compte TikTok pour commencer à publier automatiquement vos vidéos virales.
                            </div>
                            {authUrl && (
                                <a href={authUrl} className="btn btn-primary" target="_blank" rel="noopener noreferrer" style={{ marginTop: '16px' }}>
                                    🔗 Connecter TikTok
                                </a>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid-2">
                        {accounts.map(acc => (
                            <div key={acc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {acc.avatar_url ? (
                                    <img src={acc.avatar_url} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
                                        {acc.username?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '16px' }}>@{acc.username}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>{acc.display_name}</div>
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                        <div style={{ fontSize: '13px' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {(acc.follower_count || 0).toLocaleString()}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)' }}> abonnés</span>
                                        </div>
                                        <div style={{ fontSize: '13px' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{acc.video_count || 0}</span>
                                            <span style={{ color: 'var(--text-muted)' }}> vidéos</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <span className="badge badge-approved">✓ Connecté</span>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDisconnect(acc.id)}>
                                        Déconnecter
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TikTok API Config */}
                <div className="card" style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>⚙️ Configuration API TikTok</h3>
                    <div className="grid-2">
                        <div className="input-group">
                            <label className="input-label">Client Key</label>
                            <input className="input" type="password" placeholder="••••••••••••••••" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Client Secret</label>
                            <input className="input" type="password" placeholder="••••••••••••••••" />
                        </div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        💡 Les clés API TikTok sont configurées via le fichier .env.
                        Visitez <a href="https://developers.tiktok.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-purple)' }}>developers.tiktok.com</a> pour obtenir vos clés.
                    </div>
                </div>
            </div>
        </>
    );
}
