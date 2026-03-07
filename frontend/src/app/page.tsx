'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();
    useEffect(() => {
        // AUTHENTICATION DISABLED - always go to dashboard
        router.push('/dashboard');
    }, []);
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
    );
}
