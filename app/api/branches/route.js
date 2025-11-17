import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url);
    const name = searchParams.get('name') ?? null;
    const branchType = searchParams.get('branchType') ?? null;
    const pageParam = Number(searchParams.get('page')) || 1;
    const sizeParam = searchParams.get('size') || 10;

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
            `${process.env.bitbucket_domain_api}/2.0/repositories/${process.env.bitbucket_workspace}/${process.env.bitbucket_repo_slug}/refs/branches`,
            {
                auth: {
                    username: process.env.bitbucket_username,
                    password: process.env.bitbucket_app_password,
                },
                params: {
                    page: pageParam,
                    pagelen: sizeParam,
                    q: buildSearchQuery(name, branchType)
                },
            }
        );

        const branches = data?.values ?? [];

        const mergeResults = await Promise.all(
            branches.map(async (branch) => {
                if (!branch?.name) return null;

                const mergeUrl = new URL('/api/branches/merge-status', origin);
                mergeUrl.searchParams.set('from', branch.name);
                mergeUrl.searchParams.append('to', 'staging');
                mergeUrl.searchParams.append('to', 'uat');
                mergeUrl.searchParams.append('to', 'testing-operation');
                mergeUrl.searchParams.append('to', 'master');

                try {
                    const { data: mergeData } = await axios.get(mergeUrl.toString());
                    return {
                        staging: mergeData?.mergeStatus?.staging?.merged ?? false,
                        uat: mergeData?.mergeStatus?.uat?.merged ?? false,
                        'testing-operation': mergeData?.mergeStatus?.['testing-operation']?.merged ?? false,
                        master: mergeData?.mergeStatus?.master?.merged ?? false 
                    };
                } catch (error) {
                    console.error(`Failed merge-status for ${branch.name}`, error?.message);
                    return null;
                }
            })
        );

        const enrichedBranches = branches.map((branch, index) => ({
            name: branch?.name,
            branchType: branch?.name?.split('/')?.[0] ?? null,
            authorName: branch?.target?.author?.user?.display_name ?? null,
            lastCommitDate: branch?.target?.date ?? null,
            mergeStatus: mergeResults[index],
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