import { NextResponse } from 'next/server';
import axios from 'axios';

import { getCredentials } from '@/app/lib/bitbucket';

export async function GET(request) {
    const creds = getCredentials(request);
    if (creds.error) return NextResponse.json({ error: creds.error }, { status: creds.status });

    const { username, appPassword, workspace, repoSlug, domainApi } = creds;

    const env = ['dev', 'staging', 'uat', 'uat-dab', 'testing-operation', 'master']
    const pagelen = 100;
    const baseUrl = `${domainApi}/2.0/repositories/${workspace}/${repoSlug}/refs/branches`;
    let nextUrl = `${baseUrl}?pagelen=${pagelen}`;
    let data = [];
    
    try {
        while(nextUrl){
            const { data: response } = await axios.get(nextUrl,
                {
                    auth: {
                        username: username,
                        password: appPassword
                    },
                });
                
            data.push(...response.values);
            nextUrl = response.next || null;
        }
        
        return NextResponse.json({ 
            data: [...new Set(data?.map(obj => obj?.name?.split("/")?.[0] ?? null))]?.filter(value => !env?.includes(value))
        });
    } catch (error) {
        console.error(error)
        return Response.json({ error: error?.message }, { status: 500 })
    }
}