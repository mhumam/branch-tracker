'use client';

import { useState } from 'react';

const CONFIG_KEY = 'v3_bb_configured'; // Hanya flag "sudah dikonfigurasi", bukan kredensial

export function useBitbucketConfig() {
    // Kita tidak menyimpan credentials di state/sessionStorage lagi.
    // Hanya menyimpan flag bahwa session sudah dikonfigurasi.
    const [isConfigured, setIsConfigured] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !!sessionStorage.getItem(CONFIG_KEY);
    });

    /**
     * Kirim credentials ke server untuk disimpan sebagai HttpOnly cookie.
     * Credentials tidak pernah disimpan di browser storage maupun state.
     */
    const save = async (newConfig) => {
        const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConfig),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to save session');
        }

        // Hanya simpan flag (bukan credentials)
        sessionStorage.setItem(CONFIG_KEY, 'true');
        setIsConfigured(true);
        return true;
    };

    /**
     * Tandai bahwa session sudah dikonfigurasi (credentials sudah disimpan oleh komponen lain).
     * Hanya update flag, TIDAK memanggil API session.
     */
    const markConfigured = () => {
        sessionStorage.setItem(CONFIG_KEY, 'true');
        setIsConfigured(true);
    };

    /**
     * Hapus session (logout).
     */
    const clear = async () => {
        await fetch('/api/auth/session', { method: 'DELETE' });
        sessionStorage.removeItem(CONFIG_KEY);
        setIsConfigured(false);
    };

    return { isConfigured, save, markConfigured, clear };
}
