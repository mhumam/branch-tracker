export function getCredentials(request) {
    const username = request.headers.get('x-bb-username');
    const appPassword = request.headers.get('x-bb-password');
    const workspace = request.headers.get('x-bb-workspace');
    const repoSlug = request.headers.get('x-bb-repo-slug');
    const domainApi = request.headers.get('x-bb-domain') || 'https://api.bitbucket.org';

    if (!username || !appPassword || !workspace || !repoSlug) {
        return { error: 'Missing Bitbucket credentials. Please configure via the app setup.', status: 401 };
    }

    return { username, appPassword, workspace, repoSlug, domainApi };
}
