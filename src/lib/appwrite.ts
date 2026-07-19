import { Client, Account, Databases, Storage } from 'appwrite'

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1'
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'site-v1'

export const APPWRITE_PROJECT_ID      = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID      || 'site-v1';
export const APPWRITE_PROJECT_NAME    = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME    || 'PeterSmart Technologies';
export const APPWRITE_PUBLIC_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT        || 'https://nyc.cloud.appwrite.io/v1';

const client = new Client();

if (APPWRITE_PUBLIC_ENDPOINT && APPWRITE_PROJECT_ID) {
  client.setEndpoint(APPWRITE_PUBLIC_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
}

export const databases = new Databases(client);
export const storage   = new Storage(client);
export const account   = new Account(client);
export { client };
