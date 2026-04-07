import { NextResponse } from 'next/server';
import { saveSession, clearSession } from '@/app/lib/session';

/**
 * POST /api/auth/session
 * Menyimpan credentials ke HttpOnly encrypted cookie.
 * Body: { username, appPassword, workspace, repoSlug, domainApi }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { username, appPassword, workspace, repoSlug, domainApi } = body;

        if (!username || !appPassword || !workspace || !repoSlug) {
            return NextResponse.json(
                { error: 'Missing required credentials' },
                { status: 400 }
            );
        }

        await saveSession({
            username,
            appPassword,
            workspace,
            repoSlug,
            domainApi: domainApi || 'https://api.bitbucket.org',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[POST /api/auth/session]', error);
        return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
    }
}

/**
 * DELETE /api/auth/session
 * Menghapus session cookie (logout / reset).
 */
export async function DELETE() {
    try {
        await clearSession();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/auth/session]', error);
        return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 });
    }
}
