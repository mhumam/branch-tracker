import { NextResponse } from 'next/server';
import axios from 'axios';

import { getCredentials } from '@/app/lib/bitbucket';

export async function GET(request) {
    const creds = getCredentials(request);
    if (creds.error) return NextResponse.json({ error: creds.error }, { status: creds.status });

    const { username, appPassword, workspace, repoSlug, domainApi } = creds;

    const { searchParams, origin } = new URL(request.url);
    const name = searchParams.get('name') ?? null;
    const branchType = searchParams.get('branchType') ?? null;
    const pageParam = Number(searchParams.get('page')) || 1;
    const sizeParam = Number(searchParams.get('size')) || 10;
    const primaryBranch = searchParams.get('primaryBranch') || null;
    
    // Headers to pass to sub-requests
    const bbHeaders = {
        'x-bb-username': username,
        'x-bb-password': appPassword,
        'x-bb-workspace': workspace,
        'x-bb-repo-slug': repoSlug,
        'x-bb-domain': domainApi
    };

    const buildSearchQuery = (name, branchType) => {
        if (name && branchType) {
            return `name~"${branchType}/${name}"`;
        }
        if (name) {
            return `name~"${name}"`;
        }
        if (branchType) {
            return `name~"${branchType}/"`;
        }
        return undefined;
    };

    try {
        const { data } = await axios.get(
            `${domainApi}/2.0/repositories/${workspace}/${repoSlug}/refs/branches`,
            {
                auth: {
                    username: username,
                    password: appPassword,
                },
                params: {
                    page: pageParam,
                    pagelen: sizeParam,
                    q: buildSearchQuery(name, branchType)
                },
            }
        );

        const branches = data?.values ?? [];

        // Task 4: Only check primary merge status if requested
        const primaryStatusResults = await Promise.all(
            branches.map(async (branch) => {
                if (!branch?.name || !primaryBranch) return null;

                const mergeUrl = new URL('/api/branches/merge-status', origin);
                mergeUrl.searchParams.set('from', branch.name);
                mergeUrl.searchParams.append('to', primaryBranch);

                try {
                    const { data: mergeData } = await axios.get(mergeUrl.toString(), {
                        headers: bbHeaders
                    });
                    return mergeData?.mergeStatus?.[primaryBranch]?.merged ?? false;
                } catch (error) {
                    console.error(`Failed primary-merge-status for ${branch.name}`, error?.message);
                    return false;
                }
            })
        );

        const enrichedBranches = branches.map((branch, index) => ({
            name: branch?.name,
            branchType: branch?.name?.split('/')?.[0] ?? null,
            authorName: branch?.target?.author?.user?.display_name ?? null,
            lastCommitDate: branch?.target?.date ?? null,
            primaryMergeStatus: primaryStatusResults[index],
            mergeStatus: null, // Full status will be loaded on demand
        }));
        
        const rewriteUrl = (remoteUrl) => {
            if (!remoteUrl) return null;
            const remote = new URL(remoteUrl);
            const page = remote.searchParams.get('page');
            const pagelen = remote.searchParams.get('pagelen');

            const local = new URL('/api/branches', origin);
            if (page) local.searchParams.set('page', page);
            if (pagelen) local.searchParams.set('size', pagelen);
            return local.toString();
        };
        
        const currentSize = data?.values?.length ?? 0;
        const totalItems = data?.size ?? currentSize;
        const totalPages = Math.max(1, Math.ceil(totalItems / sizeParam));

        const responseData = {
            currentPage: data?.page,
            pageLimit: data?.pagelen,
            totalData: data?.size,
            data: enrichedBranches,
            totalPages,
            next: rewriteUrl(data?.next),
            previous: rewriteUrl(data?.previous),
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error?.message }, { status: 500 });
    }
}
