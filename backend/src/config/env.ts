import dotenv from 'dotenv';

dotenv.config();

// Load environment variables

export const SUPABASE_URL = process.env.SUPABASE_URL as string;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string; 

export const AWS_REGION = process.env.AWS_REGION as string;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME as string;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string;

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

export const TOKEN_SECRET = process.env.TOKEN_SECRET as string;