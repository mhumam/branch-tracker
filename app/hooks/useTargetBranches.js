'use client';

import { useState } from 'react';
import { encryptJSON, decryptJSON } from '@/app/lib/encryption';

const TARGET_BRANCHES_KEY = 'v3_target_branches_encrypted';
const TARGET_BRANCHES_CONFIGURED_KEY = 'v3_targets_configured';

const DEFAULT_BRANCHES = [
    { branchName: 'staging', displayName: 'Staging', isPrimary: false },
    { branchName: 'uat', displayName: 'UAT', isPrimary: false },
    { branchName: 'testing-operation', displayName: 'Testing Operation', isPrimary: false },
    { branchName: 'master', displayName: 'Production', isPrimary: true },
];

export function useTargetBranches() {
    const [targetBranches, setTargetBranches] = useState(() => {
        if (typeof window === 'undefined') return [];
        const saved = sessionStorage.getItem(TARGET_BRANCHES_KEY);
        if (saved) {
            try {
                const decrypted = decryptJSON(saved);
                return decrypted || [];
            } catch (e) {
                console.error('Failed to parse targetBranches', e);
                return [];
            }
        }
        return [];
    });

    const isTargetConfigured = typeof window !== 'undefined' ? !!sessionStorage.getItem(TARGET_BRANCHES_CONFIGURED_KEY) : false;

    // Task 2: Computed primary branch
    const primaryBranch = targetBranches.find(b => b.isPrimary)?.branchName 
        || targetBranches[targetBranches.length - 1]?.branchName 
        || 'master';

    const save = (branches) => {
        setTargetBranches(branches);
        const encrypted = encryptJSON(branches);
        if (encrypted) {
            sessionStorage.setItem(TARGET_BRANCHES_KEY, encrypted);
            sessionStorage.setItem(TARGET_BRANCHES_CONFIGURED_KEY, 'true');
        }
    };

    const setPrimaryBranch = (branchName) => {
        const updated = targetBranches.map(b => ({
            ...b,
            isPrimary: b.branchName === branchName
        }));
        save(updated);
    };

    const resetToDefault = () => {
        save(DEFAULT_BRANCHES);
    };

    const clear = () => {
        setTargetBranches([]);
        sessionStorage.removeItem(TARGET_BRANCHES_KEY);
        sessionStorage.removeItem(TARGET_BRANCHES_CONFIGURED_KEY);
    };

    return { targetBranches, primaryBranch, setPrimaryBranch, isTargetConfigured, save, resetToDefault, clear };
}
