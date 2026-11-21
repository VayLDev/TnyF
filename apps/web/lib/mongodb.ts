import {MongoClient} from 'mongodb';
const uri=process.env.MONGODB_URI;
if(!uri) throw new Error('MONGODB_URI is required');
const g=globalThis as typeof globalThis & {mongo?:MongoClient};
const client=g.mongo??new MongoClient(uri);
if(process.env.NODE_ENV!=='production')g.mongo=client;
export async function getDb(){await client.connect();return client.db(process.env.MONGODB_DB??'tiny_frontier');}
