import { NextResponse } from 'next/server';
import axios from 'axios';
import { getCredentials } from '@/app/lib/bitbucket';

export async function GET(request) {
    const creds = await getCredentials();
    if (creds.error) return NextResponse.json({ error: creds.error }, { status: creds.status });

    const { username, appPassword, workspace, repoSlug, domainApi } = creds;
    const { searchParams } = new URL(request.url);

    const primaryBranch = searchParams.get('primaryBranch') || 'master';
    const mergedFilter = searchParams.get('merged'); // 'true' | 'false' | null
    const nameFilter = searchParams.get('name') ?? null;
    const branchTypeFilter = searchParams.get('branchType') ?? null;

    const auth = { username, password: appPassword };
    const baseUrl = `${domainApi}/2.0/repositories/${workspace}/${repoSlug}`;

    // Helper: build Bitbucket query string filter
    const buildSearchQuery = (name, branchType) => {
        if (name && branchType) return `name~"${branchType}/${name}"`;
        if (name) return `name~"${name}"`;
        if (branchType) return `name~"${branchType}/"`;
        return undefined;
    };

    // Helper: check if a branch is merged into primaryBranch
    const isMerged = async (branchName) => {
        try {
            const { data } = await axios.get(`${baseUrl}/commits`, {
                auth,
                params: { include: branchName, exclude: primaryBranch },
            });
            return data?.values?.length === 0;
        } catch {
            return false;
        }
    };

    try {
        const pageLen = 50;
        let allRawBranches = [];

        // 1. Fetch page 1 dari Bitbucket langsung
        const firstRes = await axios.get(`${baseUrl}/refs/branches`, {
            auth,
            params: {
                page: 1,
                pagelen: pageLen,
                q: buildSearchQuery(nameFilter, branchTypeFilter),
            },
        });

        const totalBranches = firstRes.data?.size ?? 0;
        const totalPages = Math.max(1, Math.ceil(totalBranches / pageLen));
        allRawBranches = [...(firstRes.data?.values ?? [])];

        // 2. Fetch halaman berikutnya secara paralel
        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(
                    axios.get(`${baseUrl}/refs/branches`, {
                        auth,
                        params: {
                            page,
                            pagelen: pageLen,
                            q: buildSearchQuery(nameFilter, branchTypeFilter),
                        },
                    }).then(res => res.data?.values ?? [])
                );
            }
            const otherPages = await Promise.all(pagePromises);
            otherPages.forEach(page => { allRawBranches = [...allRawBranches, ...page]; });
        }

        // 3. Enrich: cek merge status tiap branch langsung ke Bitbucket
        const enrichedBranches = await Promise.all(
            allRawBranches.map(async (branch) => {
                const merged = await isMerged(branch.name);
                return {
                    name: branch?.name,
                    branchType: branch?.name?.split('/')?.[0] ?? null,
                    authorName: branch?.target?.author?.user?.display_name ?? null,
                    lastCommitDate: branch?.target?.date ?? null,
                    primaryMergeStatus: merged,
                };
            })
        );

        // 4. Filter berdasarkan mergedFilter
        let filteredBranches = enrichedBranches;
        if (mergedFilter === 'true') {
            filteredBranches = enrichedBranches.filter(b => b.primaryMergeStatus === true);
        } else if (mergedFilter === 'false') {
            filteredBranches = enrichedBranches.filter(b => b.primaryMergeStatus === false);
        }

        // 5. Summary
        const summary = {
            total: enrichedBranches.length,
            merged: enrichedBranches.filter(b => b.primaryMergeStatus === true).length,
            notMerged: enrichedBranches.filter(b => b.primaryMergeStatus === false).length,
            primaryBranch,
        };

        return NextResponse.json({
            reportDate: new Date().toISOString(),
            primaryBranch,
            workspace,
            repoSlug,
            summary,
            data: filteredBranches,
        });

    } catch (error) {
        console.error('Report API Error:', error);
        return NextResponse.json({ error: error?.message || 'Failed to generate report' }, { status: 500 });
    }
}
