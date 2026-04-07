import { NextResponse } from 'next/server';
import axios from 'axios';

import { getCredentials } from '@/app/lib/bitbucket';

export async function GET(request) {
    const creds = await getCredentials();
    if (creds.error) return NextResponse.json({ error: creds.error }, { status: creds.status });

    const { username, appPassword, workspace, repoSlug, domainApi } = creds;

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') ?? null;
    const branchType = searchParams.get('branchType') ?? null;
    const pageParam = Number(searchParams.get('page')) || 1;
    const sizeParam = Number(searchParams.get('size')) || 10;
    const primaryBranch = searchParams.get('primaryBranch') || null;

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

        // Cek primary merge status langsung ke Bitbucket API (tanpa HTTP sub-request)
        const primaryStatusResults = await Promise.all(
            branches.map(async (branch) => {
                if (!branch?.name || !primaryBranch) return null;

                try {
                    const { data: commitData } = await axios.get(
                        `${domainApi}/2.0/repositories/${workspace}/${repoSlug}/commits`,
                        {
                            auth: { username, password: appPassword },
                            params: {
                                include: branch.name,
                                exclude: primaryBranch,
                            },
                        }
                    );
                    // Jika tidak ada commit yang belum di-merge, berarti sudah merged
                    return commitData?.values?.length === 0;
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

            const { origin } = new URL(request.url);
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
