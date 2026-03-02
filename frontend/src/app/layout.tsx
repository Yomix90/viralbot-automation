import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'ViralBot — Automatisation Vidéo Virale',
    description: 'Plateforme d\'automatisation de contenu vidéo viral pour TikTok. Trouvez, transformez et publiez automatiquement des vidéos virales.',
    keywords: ['TikTok', 'YouTube', 'viral', 'automation', 'video', 'content creation'],
    openGraph: {
        title: 'ViralBot',
        description: 'Automatisation de contenu vidéo viral',
        type: 'website',
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className={inter.className}>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1a1a2e',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                        },
                        success: {
                            iconTheme: { primary: '#10b981', secondary: '#fff' },
                        },
                        error: {
                            iconTheme: { primary: '#ef4444', secondary: '#fff' },
                        },
                    }}
                />
            </body>
        </html>
    )
}
