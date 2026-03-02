'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    }, []);
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
    );
}
