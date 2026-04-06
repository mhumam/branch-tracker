import { NextResponse } from 'next/server';
import axios from 'axios';

import { getCredentials } from '@/app/lib/bitbucket';

export async function GET(request) {
    const creds = getCredentials(request);
    if (creds.error) return NextResponse.json({ error: creds.error }, { status: creds.status });

    const { username, appPassword, workspace, repoSlug, domainApi } = creds;
    const { searchParams } = new URL(request.url);

    try { 
        const toBranches = searchParams?.getAll('to');
        const fromBranch = searchParams?.get('from');
        
        if (!fromBranch || toBranches?.length === 0) {
            return NextResponse.json({ 
                error: 'Missing required parameters: from and to' 
            }, { status: 400 });
        }

        const promises = toBranches?.map(async (toBranch) => {
            try {
                const response = await axios.get(
                    `${domainApi}/2.0/repositories/${workspace}/${repoSlug}/commits`,
                    {
                        auth: {
                            username: username,
                            password: appPassword
                        },
                        params: {
                            include: fromBranch,
                            exclude: toBranch
                        }
                    }
                );

                return {
                    toBranch,
                    merged: response?.data?.values?.length === 0,
                    remainingCommits: response?.data?.values
                };
            } catch (error) {
                return {
                    toBranch,
                    merged: false,
                    remainingCommits: [],
                    error: error?.message
                };
            }
        });
        
        const results = await Promise.all(promises);

        const mergeStatus = results?.reduce((acc, result) => {
            acc[result.toBranch] = {
                merged: result?.merged,
                remainingCommits: result?.remainingCommits
            };
            return acc;
        }, {});

        return NextResponse.json({ 
            from: fromBranch,
            mergeStatus,
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error?.message }, { status: 500 });
    }
}