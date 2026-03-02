'use client';

import { useState, useEffect, useCallback } from 'react';
import { videosAPI, tiktokAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Video {
    id: number;
    youtube_id: string;
    youtube_title: string;
    youtube_channel: string;
    youtube_thumbnail: string;
    youtube_views: number;
    virality_score: number;
    status: string;
    tiktok_title: string;
    tiktok_description: string;
    tiktok_hashtags: string[];
    hook: string;
    processed_url: string;
    scheduled_at: string | null;
    published_at: string | null;
    tiktok_post_id: string | null;
    error_message: string | null;
    created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
    pending: '⏳ En attente',
    downloading: '⬇️ Téléchargement',
    processing: '🎬 Traitement',
    ai_analysis: '🧠 Analyse IA',
    ready: '✅ Prêt',
    approved: '👍 Approuvé',
    rejected: '❌ Rejeté',
    publishing: '📤 Publication',
    published: '🚀 Publié',
    failed: '💥 Échoué',
};

export default function VideosPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [tiktokAccounts, setTiktokAccounts] = useState<any[]>([]);
    const [publishModal, setPublishModal] = useState<Video | null>(null);
    const [selectedAccount, setSelectedAccount] = useState('');

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 20 };
            if (filter !== 'all') params.status = filter;
            const res = await videosAPI.list(params);
            setVideos(res.data.videos);
            setTotal(res.data.total);
        } catch (e) {
            toast.error('Erreur lors du chargement des vidéos');
        } finally {
            setLoading(false);
        }
    }, [filter, page]);

    useEffect(() => { fetchVideos(); }, [fetchVideos]);
    useEffect(() => {
        tiktokAPI.accounts().then(res => setTiktokAccounts(res.data.accounts)).catch(() => { });
    }, []);

    // Auto-refresh for processing videos
    useEffect(() => {
        const hasProcessing = videos.some(v =>
            ['pending', 'downloading', 'processing', 'ai_analysis', 'publishing'].includes(v.status)
        );
        if (!hasProcessing) return;
        const interval = setInterval(fetchVideos, 5000);
        return () => clearInterval(interval);
    }, [videos, fetchVideos]);

    const handleApprove = async (id: number) => {
        try {
            await videosAPI.approve(id);
            toast.success('✅ Vidéo approuvée!');
            fetchVideos();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Erreur');
        }
    };

    const handleReject = async (id: number) => {
        try {
            await videosAPI.reject(id);
            toast.success('Vidéo rejetée');
            fetchVideos();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Erreur');
        }
    };

    const handleReprocess = async (id: number) => {
        try {
            await videosAPI.reprocess(id);
            toast.success('🔄 Retraitement démarré');
            fetchVideos();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Erreur');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer cette vidéo?')) return;
        try {
            await videosAPI.delete(id);
            toast.success('Vidéo supprimée');
            fetchVideos();
        } catch (e) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingVideo) return;
        try {
            await videosAPI.update(editingVideo.id, {
                tiktok_title: editingVideo.tiktok_title,
                tiktok_description: editingVideo.tiktok_description,
                tiktok_hashtags: editingVideo.tiktok_hashtags,
                hook: editingVideo.hook,
            });
            toast.success('✅ Modifications sauvegardées');
            setEditingVideo(null);
            fetchVideos();
        } catch (e) {
            toast.error('Erreur lors de la sauvegarde');
        }
    };

    const handlePublish = async () => {
        if (!publishModal || !selectedAccount) return;
        try {
            await tiktokAPI.publish({ video_id: publishModal.id, account_id: Number(selectedAccount) });
            toast.success('🚀 Publication démarrée!');
            setPublishModal(null);
            fetchVideos();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Erreur de publication');
        }
    };

    const filters = [
        { key: 'all', label: 'Toutes' },
        { key: 'ready', label: '✅ Prêtes' },
        { key: 'approved', label: '👍 Approuvées' },
        { key: 'published', label: '🚀 Publiées' },
        { key: 'processing', label: '⚙️ En cours' },
        { key: 'failed', label: '💥 Échouées' },
    ];

    return (
        <>
            <header className="header">
                <div>
                    <h1 className="header-title">🎬 Mes Vidéos</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {total} vidéo{total !== 1 ? 's' : ''} dans le pipeline
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={fetchVideos}>🔄 Actualiser</button>
            </header>

            <div className="page-content">
                {/* Filters */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {filters.map(f => (
                        <button
                            key={f.key}
                            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => { setFilter(f.key); setPage(1); }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
                        <div className="spinner" style={{ width: '40px', height: '40px' }} />
                    </div>
                ) : videos.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">🎬</div>
                            <div className="empty-state-title">Aucune vidéo trouvée</div>
                            <div className="empty-state-text">
                                Commencez par rechercher des vidéos virales sur YouTube et importez-les.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Vidéo</th>
                                    <th>Statut</th>
                                    <th>Scoring</th>
                                    <th>Contenu TikTok</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {videos.map(video => (
                                    <tr key={video.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '250px' }}>
                                                {video.youtube_thumbnail && (
                                                    <img
                                                        src={video.youtube_thumbnail}
                                                        alt=""
                                                        style={{ width: '64px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                                                    />
                                                )}
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '200px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                        {video.youtube_title}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        {video.youtube_channel}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${video.status}`}>
                                                {STATUS_LABELS[video.status] || video.status}
                                            </span>
                                            {video.error_message && (
                                                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', maxWidth: '150px' }}>
                                                    ⚠️ {video.error_message.substring(0, 60)}...
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff0050' }}>
                                                🔥 {video.virality_score?.toFixed(1)}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                👁 {(video.youtube_views / 1000).toFixed(0)}K vues
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '200px' }}>
                                            {video.tiktok_title ? (
                                                <>
                                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                        {video.tiktok_title}
                                                    </div>
                                                    {video.tiktok_hashtags?.length > 0 && (
                                                        <div style={{ fontSize: '11px', color: 'var(--accent-purple)', marginTop: '3px' }}>
                                                            #{video.tiktok_hashtags.slice(0, 3).join(' #')}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Génération IA...</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {new Date(video.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => setSelectedVideo(video)}
                                                    title="Voir détails"
                                                >
                                                    👁
                                                </button>
                                                {video.tiktok_title && (
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => setEditingVideo({ ...video })}
                                                        title="Modifier"
                                                    >
                                                        ✏️
                                                    </button>
                                                )}
                                                {video.status === 'ready' && (
                                                    <>
                                                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(video.id)}>✓ OK</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(video.id)}>✗</button>
                                                    </>
                                                )}
                                                {video.status === 'approved' && (
                                                    <button className="btn btn-primary btn-sm" onClick={() => setPublishModal(video)}>
                                                        📤 Publier
                                                    </button>
                                                )}
                                                {video.status === 'failed' && (
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleReprocess(video.id)}>
                                                        🔄
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(video.id)}
                                                    title="Supprimer"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {total > 20 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                        <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                            ← Précédent
                        </button>
                        <span style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Page {page} / {Math.ceil(total / 20)}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={page >= Math.ceil(total / 20)}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Suivant →
                        </button>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingVideo && (
                <div className="modal-overlay" onClick={() => setEditingVideo(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">✏️ Modifier le Contenu TikTok</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingVideo(null)}>✕</button>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Titre TikTok</label>
                            <input
                                className="input"
                                value={editingVideo.tiktok_title || ''}
                                onChange={e => setEditingVideo(v => v ? { ...v, tiktok_title: e.target.value } : null)}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Hook (3 premières secondes)</label>
                            <input
                                className="input"
                                value={editingVideo.hook || ''}
                                onChange={e => setEditingVideo(v => v ? { ...v, hook: e.target.value } : null)}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Description</label>
                            <textarea
                                className="textarea"
                                value={editingVideo.tiktok_description || ''}
                                onChange={e => setEditingVideo(v => v ? { ...v, tiktok_description: e.target.value } : null)}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Hashtags (séparés par des virgules)</label>
                            <input
                                className="input"
                                value={(editingVideo.tiktok_hashtags || []).join(', ')}
                                onChange={e => setEditingVideo(v => v ? {
                                    ...v,
                                    tiktok_hashtags: e.target.value.split(',').map(h => h.trim()).filter(Boolean)
                                } : null)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveEdit}>
                                💾 Sauvegarder
                            </button>
                            <button className="btn btn-secondary" onClick={() => setEditingVideo(null)}>
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Modal */}
            {publishModal && (
                <div className="modal-overlay" onClick={() => setPublishModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">📤 Publier sur TikTok</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setPublishModal(null)}>✕</button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
                            {publishModal.tiktok_title || publishModal.youtube_title}
                        </p>
                        {tiktokAccounts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                <p>Aucun compte TikTok connecté.</p>
                                <a href="/dashboard/tiktok" className="btn btn-primary" style={{ marginTop: '12px' }}>
                                    Connecter un compte
                                </a>
                            </div>
                        ) : (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Compte TikTok</label>
                                    <select className="select" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                                        <option value="">Sélectionner un compte...</option>
                                        {tiktokAccounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>@{acc.username} ({acc.follower_count?.toLocaleString()} abonnés)</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={handlePublish}
                                    disabled={!selectedAccount}
                                >
                                    🚀 Publier Maintenant
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
