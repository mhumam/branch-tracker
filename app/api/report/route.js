import { NextResponse } from 'next/server';
import axios from 'axios';
import { getCredentials } from '@/app/lib/bitbucket';

export async function GET(request) {
    const creds = getCredentials(request);
    if (creds.error) return NextResponse.json({ error: creds.error }, { status: creds.status });

    const { username, appPassword, workspace, repoSlug, domainApi } = creds;
    const { searchParams, origin } = new URL(request.url);

    const primaryBranch = searchParams.get('primaryBranch') || 'master';
    const mergedFilter = searchParams.get('merged'); // 'true' | 'false' | null
    const nameFilter = searchParams.get('name') ?? null;
    const branchTypeFilter = searchParams.get('branchType') ?? null;
    
    const bbHeaders = {
        'x-bb-username': username,
        'x-bb-password': appPassword,
        'x-bb-workspace': workspace,
        'x-bb-repo-slug': repoSlug,
        'x-bb-domain': domainApi
    };

    try {
        const pageSize = 50;
        let allBranches = [];

        // 1. Fetch Page 1
        const initialRes = await axios.get(`${origin}/api/branches`, {
            params: { page: 1, size: pageSize, name: nameFilter, branchType: branchTypeFilter, primaryBranch: primaryBranch },
            headers: bbHeaders
        });

        const { totalData, data: firstPageData, totalPages } = initialRes.data;
        allBranches = [...firstPageData];

        // 2. Fetch all other pages in parallel if there are more
        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(
                    axios.get(`${origin}/api/branches`, {
                        params: { page, size: pageSize, name: nameFilter, branchType: branchTypeFilter, primaryBranch: primaryBranch },
                        headers: bbHeaders
                    }).then(res => res.data.data)
                );
            }
            const otherPagesData = await Promise.all(pagePromises);
            otherPagesData.forEach(pageData => {
                allBranches = [...allBranches, ...pageData];
            });
        }

        // 3. Status Filtering (Client side filtering from server side perspective)
        let filteredBranches = allBranches;
        if (mergedFilter === 'true') {
            filteredBranches = allBranches.filter(b => b.primaryMergeStatus === true);
        } else if (mergedFilter === 'false') {
            filteredBranches = allBranches.filter(b => b.primaryMergeStatus === false);
        }

        // 4. Calculate Summary
        const summary = {
            total: allBranches.length,
            merged: allBranches.filter(b => b.primaryMergeStatus === true).length,
            notMerged: allBranches.filter(b => b.primaryMergeStatus === false).length,
            primaryBranch
        };

        return NextResponse.json({
            reportDate: new Date().toISOString(),
            primaryBranch,
            summary,
            data: filteredBranches
        });

    } catch (error) {
        console.error('Report API Error:', error);
        return NextResponse.json({ error: error?.message || 'Failed to generate report' }, { status: 500 });
    }
}
