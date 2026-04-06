'use client';

import { useState } from 'react';
import { encryptJSON, decryptJSON } from '@/app/lib/encryption';

const CONFIG_KEY = 'v3_bb_config_encrypted';

export function useBitbucketConfig() {
    const [config, setConfig] = useState(() => {
        if (typeof window === 'undefined') return null;
        const saved = sessionStorage.getItem(CONFIG_KEY);
        if (saved) {
            try {
                // Return decrypted JSON object
                return decryptJSON(saved);
            } catch (e) {
                console.error('Failed to decrypt bitbucketConfig', e);
                return null;
            }
        }
        return null;
    });

    const isConfigured = !!(config !== null && 
        config.username && config.appPassword && 
        config.workspace && config.repoSlug);

    const save = (newConfig) => {
        setConfig(newConfig);
        const encrypted = encryptJSON(newConfig);
        if (encrypted) {
            sessionStorage.setItem(CONFIG_KEY, encrypted);
        }
    };

    const clear = () => {
        setConfig(null);
        sessionStorage.removeItem(CONFIG_KEY);
    };

    // Helper to build headers for fetch/axios
    const getHeaders = () => {
        if (!isConfigured) return {};
        return {
            'x-bb-username': config.username || '',
            'x-bb-password': config.appPassword || '',
            'x-bb-workspace': config.workspace || '',
            'x-bb-repo-slug': config.repoSlug || '',
            'x-bb-domain': config.domainApi || 'https://api.bitbucket.org',
        };
    };

    return { config, isConfigured, save, clear, getHeaders };
}
