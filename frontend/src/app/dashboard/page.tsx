'use client';

import { useState, useEffect } from 'react';
import { dashboardAPI } from '@/lib/api';
import Link from 'next/link';

interface Stats {
    overview: {
        total_videos: number;
        total_published: number;
        total_tiktok_views: number;
        total_youtube_views: number;
        avg_virality_score: number;
        pending_approval: number;
    };
    status_breakdown: Record<string, number>;
    recent_videos: any[];
    pipeline: {
        processing: number;
        ready_to_publish: number;
        failed: number;
    };
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

function formatStatus(status: string): string {
    const map: Record<string, string> = {
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
    return map[status] || status;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await dashboardAPI.getStats();
                setStats(res.data);
            } catch (e) {
                console.error('Failed to load stats', e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const statCards = stats ? [
        {
            icon: '🎬',
            iconClass: 'purple',
            value: formatNumber(stats.overview.total_videos),
            label: 'Vidéos Totales',
            change: '+12 cette semaine',
            changeDir: 'up',
        },
        {
            icon: '🚀',
            iconClass: 'green',
            value: formatNumber(stats.overview.total_published),
            label: 'Vidéos Publiées',
            change: `${stats.status_breakdown.publishing || 0} en cours`,
            changeDir: 'up',
        },
        {
            icon: '👁️',
            iconClass: 'blue',
            value: formatNumber(stats.overview.total_tiktok_views),
            label: 'Vues TikTok',
            change: 'Cumulé',
            changeDir: 'up',
        },
        {
            icon: '🔥',
            iconClass: 'pink',
            value: formatNumber(stats.overview.total_youtube_views),
            label: 'Vues YouTube Source',
            change: 'Sources analysées',
            changeDir: 'up',
        },
        {
            icon: '⭐',
            iconClass: 'orange',
            value: stats.overview.avg_virality_score.toFixed(1),
            label: 'Score Viralité Moyen',
            change: '/ 100',
            changeDir: 'up',
        },
        {
            icon: '⏳',
            iconClass: 'cyan',
            value: stats.overview.pending_approval.toString(),
            label: 'En Attente Approbation',
            change: 'À valider',
            changeDir: stats.overview.pending_approval > 0 ? 'up' : undefined,
        },
    ] : [];

    return (
        <>
            {/* Header */}
            <header className="header">
                <div>
                    <h1 className="header-title">Dashboard</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Vue d'ensemble de votre pipeline vidéo viral
                    </p>
                </div>
                <div className="header-actions">
                    <Link href="/dashboard/search" className="btn btn-primary">
                        <span>🔍</span>
                        Chercher Vidéos
                    </Link>
                </div>
            </header>

            <div className="page-content">
                {/* Hero Banner */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(255,0,80,0.08) 0%, rgba(139,92,246,0.08) 50%, rgba(59,130,246,0.08) 100%)',
                    border: '1px solid rgba(139,92,246,0.15)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '28px 32px',
                    marginBottom: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent)', borderRadius: '50%' }} />
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                            <span className="gradient-text">ViralBot Pipeline 🚀</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '500px' }}>
                            Automatisez la recherche, le traitement et la publication de vidéos virales sur TikTok.
                            Pipeline IA complet de YouTube → TikTok.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-green)' }}>
                                {stats?.pipeline.processing || 0}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>En traitement</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-purple)' }}>
                                {stats?.pipeline.ready_to_publish || 0}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Prêts à publier</div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                {loading ? (
                    <div className="stats-grid">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="stat-card">
                                <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '12px', marginBottom: '16px' }} />
                                <div className="skeleton" style={{ width: '60%', height: '32px', marginBottom: '8px' }} />
                                <div className="skeleton" style={{ width: '80%', height: '14px' }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="stats-grid">
                        {statCards.map((card, i) => (
                            <div key={i} className="stat-card">
                                <div className={`stat-icon ${card.iconClass}`}>{card.icon}</div>
                                <div className="stat-value">{card.value}</div>
                                <div className="stat-label">{card.label}</div>
                                {card.change && (
                                    <div className={`stat-change ${card.changeDir}`}>
                                        {card.changeDir === 'up' ? '↑' : '↓'} {card.change}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid-2" style={{ marginBottom: '24px' }}>
                    {/* Pipeline Status */}
                    <div className="card card-elevated">
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⚡</span> Statut du Pipeline
                        </h3>
                        {stats && Object.entries(stats.status_breakdown).map(([status, count]) => (
                            <div key={status} style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatStatus(status)}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${Math.min(100, (count / Math.max(1, stats.overview.total_videos)) * 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Videos */}
                    <div className="card card-elevated">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🎥</span> Vidéos Récentes
                            </h3>
                            <Link href="/dashboard/videos" className="btn btn-ghost btn-sm">Voir tout →</Link>
                        </div>
                        {stats?.recent_videos.length === 0 ? (
                            <div className="empty-state" style={{ padding: '32px' }}>
                                <div className="empty-state-icon" style={{ fontSize: '40px' }}>🎬</div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Aucune vidéo encore. Commencez par rechercher!</p>
                            </div>
                        ) : (
                            stats?.recent_videos.map((video) => (
                                <div key={video.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 0',
                                    borderBottom: '1px solid var(--border)',
                                }}>
                                    {video.thumbnail && (
                                        <img
                                            src={video.thumbnail}
                                            alt=""
                                            style={{ width: '56px', height: '36px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                                        />
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                            {video.title}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                            <span className={`badge badge-${video.status}`} style={{ fontSize: '11px', padding: '1px 7px' }}>
                                                {video.status}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                🔥 {video.virality_score?.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>⚡ Actions Rapides</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <Link href="/dashboard/search" className="btn btn-primary">
                            🔍 Chercher Vidéos Virales
                        </Link>
                        <Link href="/dashboard/videos?status=ready" className="btn btn-secondary">
                            ✅ Approuver des Vidéos ({stats?.overview.pending_approval || 0})
                        </Link>
                        <Link href="/dashboard/tiktok" className="btn btn-secondary">
                            📱 Gérer Comptes TikTok
                        </Link>
                        <Link href="/dashboard/workflow" className="btn btn-secondary">
                            🔄 Configurer n8n
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
