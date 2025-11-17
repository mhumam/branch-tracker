import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
    const env = ['dev', 'staging', 'uat', 'uat-dab', 'testing-operation', 'master']
    const pagelen = 100;
    const baseUrl = `${process.env.bitbucket_domain_api}/2.0/repositories/${process.env.bitbucket_workspace}/${process.env.bitbucket_repo_slug}/refs/branches`;
    let nextUrl = `${baseUrl}?pagelen=${pagelen}`;
    let data = [];
    
    try {
        while(nextUrl){
            const { data: response } = await axios.get(nextUrl,
                {
                    auth: {
                        username: process.env.bitbucket_username,
                        password: process.env.bitbucket_app_password
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