import {NextResponse} from 'next/server';
// Deliberately disabled until Montenyon server-side session verification is wired.
export async function GET(){return NextResponse.json({error:'World API is disabled until authenticated owner scoping is configured.'},{status:501});}
export async function POST(){return NextResponse.json({error:'World API is disabled until authenticated owner scoping is configured.'},{status:501});}
