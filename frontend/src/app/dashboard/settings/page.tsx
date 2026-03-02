'use client';

import { useEffect, useState } from 'react';
import { settingsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        settingsAPI.get().then(res => {
            setSettings(res.data);
        }).catch(() => {
            toast.error('Erreur de chargement des paramètres');
        }).finally(() => setLoading(false));
    }, []);

    return (
        <>
            <header className="header">
                <div>
                    <h1 className="header-title">⚙️ Paramètres</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Configuration de l'application ViralBot
                    </p>
                </div>
            </header>

            <div className="page-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* API Keys */}
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🔑 Clés API
                        </h3>
                        <div className="grid-2">
                            <div>
                                <div className="input-group">
                                    <label className="input-label">YouTube Data API v3</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input className="input" type="password" defaultValue="AIzaSyDrJpDyeinN_3CFy1..." readOnly />
                                        <span className="badge badge-approved" style={{ flexShrink: 0, alignSelf: 'center' }}>✓ Configuré</span>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">OpenAI API Key</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input className="input" type="password" placeholder="sk-..." />
                                        <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>Sauvegarder</button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="input-group">
                                    <label className="input-label">TikTok Client Key</label>
                                    <input className="input" type="password" placeholder="••••••••" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">TikTok Client Secret</label>
                                    <input className="input" type="password" placeholder="••••••••" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Settings */}
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🧠 Paramètres IA
                        </h3>
                        <div className="grid-2">
                            <div className="input-group">
                                <label className="input-label">Modèle OpenAI</label>
                                <select className="select">
                                    <option value="gpt-4-turbo-preview">GPT-4 Turbo (Recommandé)</option>
                                    <option value="gpt-4">GPT-4</option>
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Économique)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Modèle Whisper (Transcription)</label>
                                <select className="select">
                                    <option value="whisper-1">Whisper-1 (Recommandé)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Langue par défaut</label>
                                <select className="select">
                                    <option value="fr">🇫🇷 Français</option>
                                    <option value="en">🇺🇸 Anglais</option>
                                    <option value="ar">🇲🇦 Arabe</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Traduction automatique</label>
                                <select className="select">
                                    <option value="no">Non</option>
                                    <option value="yes">Oui - Traduire en français</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Video Processing Settings */}
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🎬 Paramètres Montage Vidéo
                        </h3>
                        <div className="grid-2">
                            <div className="input-group">
                                <label className="input-label">Durée cible (secondes)</label>
                                <select className="select">
                                    <option value="15">15 secondes</option>
                                    <option value="30">30 secondes</option>
                                    <option value="60">60 secondes</option>
                                    <option value="90">90 secondes</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Qualité de sortie</label>
                                <select className="select">
                                    <option value="high">Haute qualité (4Mbps)</option>
                                    <option value="medium">Qualité moyenne (2Mbps)</option>
                                    <option value="low">Économique (1Mbps)</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Ajouter des sous-titres dynamiques', defaultChecked: true },
                                { label: 'Ajouter une barre de progression', defaultChecked: true },
                                { label: 'Re-cadrage intelligent (détection visage)', defaultChecked: true },
                                { label: 'Fond flou pour vidéos non-verticales', defaultChecked: false },
                            ].map((option, i) => (
                                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                    <input type="checkbox" defaultChecked={option.defaultChecked} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-purple)' }} />
                                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Publication Settings */}
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📤 Paramètres de Publication
                        </h3>
                        <div className="grid-2">
                            <div className="input-group">
                                <label className="input-label">Intervalle de publication</label>
                                <select className="select">
                                    <option value="2">Toutes les 2 heures</option>
                                    <option value="4">Toutes les 4 heures</option>
                                    <option value="6">Toutes les 6 heures</option>
                                    <option value="12">Toutes les 12 heures</option>
                                    <option value="24">1 par jour</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Max publications/jour</label>
                                <select className="select">
                                    <option value="1">1 vidéo/jour</option>
                                    <option value="2">2 vidéos/jour</option>
                                    <option value="3">3 vidéos/jour</option>
                                    <option value="5">5 vidéos/jour</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Confidentialité par défaut</label>
                                <select className="select">
                                    <option value="SELF_ONLY">Privé (pour test)</option>
                                    <option value="FRIENDS_ONLY">Amis uniquement</option>
                                    <option value="PUBLIC_TO_EVERYONE">Public</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--accent-purple)' }} />
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    Publication automatique (sans approbation manuelle)
                                </span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--accent-purple)' }} />
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    Vérification anti-duplicate (éviter de reposter la même vidéo)
                                </span>
                            </label>
                        </div>
                    </div>

                    <button className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start' }}>
                        💾 Sauvegarder les Paramètres
                    </button>
                </div>
            </div>
        </>
    );
}
