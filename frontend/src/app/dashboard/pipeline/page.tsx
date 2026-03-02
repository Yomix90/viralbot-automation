'use client';

import { useState, useEffect } from 'react';
import { videosAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PipelineVideo {
    id: number;
    youtube_title: string;
    youtube_thumbnail: string;
    status: string;
    virality_score: number;
    created_at: string;
    error_message: string | null;
}

const STEPS = [
    { key: 'pending', label: 'En File d\'Attente', icon: '⏳' },
    { key: 'downloading', label: 'Téléchargement', icon: '⬇️' },
    { key: 'processing', label: 'Traitement Vidéo', icon: '🎬' },
    { key: 'ai_analysis', label: 'Analyse IA', icon: '🧠' },
    { key: 'ready', label: 'Prêt pour Revue', icon: '✅' },
];

export default function PipelinePage() {
    const [videos, setVideos] = useState<PipelineVideo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPipeline = async () => {
        try {
            // Fetch all videos and filter for processing ones in frontend or use multiple calls
            const res = await videosAPI.list({ limit: 50 });
            const pipelineStatuses = ['pending', 'downloading', 'processing', 'ai_analysis', 'ready'];
            const processingVideos = res.data.videos.filter((v: any) =>
                pipelineStatuses.includes(v.status)
            );
            setVideos(processingVideos);
        } catch (e) {
            console.error('Failed to fetch pipeline', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPipeline();
        const interval = setInterval(fetchPipeline, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleReprocess = async (id: number) => {
        try {
            await videosAPI.reprocess(id);
            toast.success('Retraitement démarré');
            fetchPipeline();
        } catch (e) {
            toast.error('Erreur');
        }
    };

    return (
        <>
            <header className="header">
                <div>
                    <h1 className="header-title">⚡ Pipeline IA en Temps Réel</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Suivez l'avancement de la transformation YouTube → TikTok
                    </p>
                </div>
                <Link href="/dashboard/search" className="btn btn-primary">
                    🚀 Nouvelle Extraction
                </Link>
            </header>

            <div className="page-content">
                {videos.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛰️</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Pipeline Inactif</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 24px' }}>
                            Aucune vidéo n'est en cours de traitement pour le moment.
                        </p>
                        <Link href="/dashboard/search" className="btn btn-secondary">
                            Lancer une recherche
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {videos.map(video => (
                            <div key={video.id} className="card card-elevated" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                                        <img
                                            src={video.youtube_thumbnail}
                                            alt=""
                                            style={{ width: '80px', height: '45px', borderRadius: '8px', objectFit: 'cover' }}
                                        />
                                        <div style={{ minWidth: 0 }}>
                                            <h3 style={{ fontSize: '15px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {video.youtube_title}
                                            </h3>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                Ajouté le {new Date(video.created_at).toLocaleString('fr-FR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#ff0050' }}>🔥 {video.virality_score?.toFixed(0)}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Score Viralité</div>
                                    </div>
                                </div>

                                {/* Stepper */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '10px' }}>
                                    {/* Line background */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '15px',
                                        left: '5%',
                                        right: '5%',
                                        height: '2px',
                                        background: 'var(--border)',
                                        zIndex: 0
                                    }} />

                                    {STEPS.map((step, idx) => {
                                        const isCompleted = STEPS.findIndex(s => s.key === video.status) > idx || video.status === 'ready';
                                        const isActive = video.status === step.key;

                                        return (
                                            <div key={step.key} style={{
                                                zIndex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                width: '20%',
                                                opacity: isCompleted || isActive ? 1 : 0.4
                                            }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: isActive ? 'var(--accent-purple)' : isCompleted ? 'var(--accent-green)' : 'var(--bg-secondary)',
                                                    border: `2px solid ${isActive ? 'var(--accent-purple)' : isCompleted ? 'var(--accent-green)' : 'var(--border)'}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '14px',
                                                    marginBottom: '8px',
                                                    color: isCompleted || isActive ? 'white' : 'inherit',
                                                    boxShadow: isActive ? '0 0 15px rgba(139,92,246,0.3)' : 'none'
                                                }}>
                                                    {isCompleted ? '✓' : step.icon}
                                                </div>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: (isActive || isCompleted) ? 700 : 400,
                                                    textAlign: 'center',
                                                    color: isActive ? 'var(--accent-purple)' : 'inherit'
                                                }}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {video.status === 'ready' && (
                                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Link href="/dashboard/videos" className="btn btn-success btn-sm">
                                            🔍 Voir pour approbation
                                        </Link>
                                    </div>
                                )}

                                {video.error_message && (
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '12px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        color: '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span>⚠️ Error: {video.error_message}</span>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleReprocess(video.id)}>Réessayer</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
