import { getSession } from '@/app/lib/session';

/**
 * Membaca credentials Bitbucket dari server-side encrypted session cookie.
 * Credentials tidak pernah terekspos ke browser (HttpOnly cookie).
 */
export async function getCredentials() {
    const session = await getSession();

    if (!session) {
        return { error: 'No active session. Please configure credentials first.', status: 401 };
    }

    const { username, appPassword, workspace, repoSlug, domainApi } = session;

    if (!username || !appPassword || !workspace || !repoSlug) {
        return { error: 'Incomplete credentials in session. Please reconfigure.', status: 401 };
    }

    return {
        username,
        appPassword,
        workspace,
        repoSlug,
        domainApi: domainApi || 'https://api.bitbucket.org',
    };
}
