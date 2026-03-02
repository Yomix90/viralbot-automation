'use client';

import { useState } from 'react';
import { youtubeAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface YoutubeVideo {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    published_at: string;
    duration_seconds: number;
    view_count: number;
    like_count: number;
    virality_score: number;
    url: string;
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatViews(views: number): string {
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
    return views.toString();
}

function ViralityBar({ score }: { score: number }) {
    const color = score >= 70 ? '#ff0050' : score >= 50 ? '#8b5cf6' : score >= 30 ? '#3b82f6' : '#6b7280';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: '99px' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color }}>{score.toFixed(0)}</span>
        </div>
    );
}

export default function SearchPage() {
    const [loading, setLoading] = useState(false);
    const [videos, setVideos] = useState<YoutubeVideo[]>([]);
    const [importingId, setImportingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'search' | 'trending'>('search');

    const [searchParams, setSearchParams] = useState({
        query: '',
        region_code: 'FR',
        min_views: 50000,
        order: 'viewCount',
        video_duration: 'medium',
        max_results: 20,
        category_id: '',
    });

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await youtubeAPI.search(searchParams);
            setVideos(res.data.videos);
            if (res.data.videos.length === 0) {
                toast('Aucune vidéo trouvée. Essayez d\'autres paramètres.', { icon: '🔍' });
            }
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Erreur lors de la recherche');
        } finally {
            setLoading(false);
        }
    };

    const handleTrending = async () => {
        setLoading(true);
        try {
            const res = await youtubeAPI.trending({ region_code: searchParams.region_code });
            setVideos(res.data.videos);
        } catch (e: any) {
            toast.error('Erreur lors du chargement des tendances');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (video: YoutubeVideo) => {
        setImportingId(video.id);
        try {
            await youtubeAPI.importVideo({
                youtube_id: video.id,
                youtube_title: video.title,
                youtube_channel: video.channel,
                youtube_url: video.url,
                youtube_thumbnail: video.thumbnail,
                youtube_views: video.view_count,
                youtube_likes: video.like_count,
                youtube_duration: video.duration_seconds,
                virality_score: video.virality_score,
            });
            toast.success('🚀 Vidéo importée! Pipeline démarré...');
        } catch (e: any) {
            const detail = e.response?.data?.detail;
            if (detail?.includes('already')) {
                toast('Cette vidéo est déjà dans le pipeline', { icon: '⚠️' });
            } else {
                toast.error(detail || 'Erreur lors de l\'importation');
            }
        } finally {
            setImportingId(null);
        }
    };

    return (
        <>
            <header className="header">
                <div>
                    <h1 className="header-title">🔍 Recherche YouTube</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Trouvez les vidéos les plus virales à transformer pour TikTok
                    </p>
                </div>
            </header>

            <div className="page-content">
                {/* Tab switcher */}
                <div className="tabs" style={{ maxWidth: '400px' }}>
                    <button className={`tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
                        🔍 Recherche
                    </button>
                    <button
                        className={`tab ${activeTab === 'trending' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('trending'); handleTrending(); }}
                    >
                        🔥 Tendances
                    </button>
                </div>

                {/* Search Form */}
                {activeTab === 'search' && (
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div className="grid-2" style={{ marginBottom: '16px' }}>
                            <div className="input-group">
                                <label className="input-label">Mot-clé de recherche</label>
                                <input
                                    className="input"
                                    placeholder="Ex: top 10, funny moments, fails..."
                                    value={searchParams.query}
                                    onChange={(e) => setSearchParams(p => ({ ...p, query: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Région</label>
                                <select
                                    className="select"
                                    value={searchParams.region_code}
                                    onChange={(e) => setSearchParams(p => ({ ...p, region_code: e.target.value }))}
                                >
                                    <option value="FR">🇫🇷 France</option>
                                    <option value="US">🇺🇸 États-Unis</option>
                                    <option value="GB">🇬🇧 Royaume-Uni</option>
                                    <option value="DE">🇩🇪 Allemagne</option>
                                    <option value="MA">🇲🇦 Maroc</option>
                                    <option value="CA">🇨🇦 Canada</option>
                                    <option value="JP">🇯🇵 Japon</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Vues minimales</label>
                                <select
                                    className="select"
                                    value={searchParams.min_views}
                                    onChange={(e) => setSearchParams(p => ({ ...p, min_views: Number(e.target.value) }))}
                                >
                                    <option value={10000}>10K+</option>
                                    <option value={50000}>50K+</option>
                                    <option value={100000}>100K+</option>
                                    <option value={500000}>500K+</option>
                                    <option value={1000000}>1M+</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Durée vidéo</label>
                                <select
                                    className="select"
                                    value={searchParams.video_duration}
                                    onChange={(e) => setSearchParams(p => ({ ...p, video_duration: e.target.value }))}
                                >
                                    <option value="short">Court (&lt; 4 min)</option>
                                    <option value="medium">Moyen (4-20 min)</option>
                                    <option value="long">Long (&gt; 20 min)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Trier par</label>
                                <select
                                    className="select"
                                    value={searchParams.order}
                                    onChange={(e) => setSearchParams(p => ({ ...p, order: e.target.value }))}
                                >
                                    <option value="viewCount">Nombre de vues</option>
                                    <option value="relevance">Pertinence</option>
                                    <option value="date">Date</option>
                                    <option value="rating">Note</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Résultats max</label>
                                <select
                                    className="select"
                                    value={searchParams.max_results}
                                    onChange={(e) => setSearchParams(p => ({ ...p, max_results: Number(e.target.value) }))}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleSearch}
                            disabled={loading}
                            style={{ width: '100%' }}
                        >
                            {loading ? <><span className="spinner" />  Recherche en cours...</> : '🔍 Lancer la Recherche'}
                        </button>
                    </div>
                )}

                {/* Results */}
                {loading && videos.length === 0 ? (
                    <div className="video-grid">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="video-card">
                                <div className="skeleton" style={{ aspectRatio: '16/9' }} />
                                <div style={{ padding: '16px' }}>
                                    <div className="skeleton" style={{ height: '14px', marginBottom: '8px' }} />
                                    <div className="skeleton" style={{ height: '14px', width: '70%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : videos.length > 0 ? (
                    <>
                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{videos.length}</strong> vidéos trouvées
                            </span>
                        </div>
                        <div className="video-grid">
                            {videos.map((video) => (
                                <div key={video.id} className="video-card">
                                    <div className="video-thumbnail">
                                        {video.thumbnail && (
                                            <img src={video.thumbnail} alt={video.title} loading="lazy" />
                                        )}
                                        <div className="video-thumbnail-overlay" />
                                        <div className="video-duration">{formatDuration(video.duration_seconds)}</div>
                                        <div className="virality-badge">🔥 {video.virality_score.toFixed(0)}</div>
                                    </div>
                                    <div className="video-card-body">
                                        <div className="video-card-title">{video.title}</div>
                                        <div className="video-card-channel">
                                            <span>📺</span> {video.channel}
                                        </div>
                                        <div className="video-stats" style={{ marginTop: '8px' }}>
                                            <div className="video-stat">
                                                <span>👁️</span> {formatViews(video.view_count)}
                                            </div>
                                            <div className="video-stat">
                                                <span>❤️</span> {formatViews(video.like_count)}
                                            </div>
                                        </div>
                                        <ViralityBar score={video.virality_score} />
                                        <div className="video-card-actions" style={{ marginTop: '12px' }}>
                                            <a
                                                href={video.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-ghost btn-sm"
                                                style={{ flex: 1 }}
                                            >
                                                👁 Voir
                                            </a>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                style={{ flex: 2 }}
                                                onClick={() => handleImport(video)}
                                                disabled={importingId === video.id}
                                            >
                                                {importingId === video.id ? (
                                                    <><span className="spinner" style={{ width: '14px', height: '14px' }} /> Importation...</>
                                                ) : '🚀 Importer'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">🎯</div>
                            <div className="empty-state-title">Prêt à découvrir des vidéos virales</div>
                            <div className="empty-state-text">
                                Utilisez les filtres ci-dessus pour rechercher des vidéos YouTube à fort potentiel viral,
                                puis importez-les dans votre pipeline IA.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
