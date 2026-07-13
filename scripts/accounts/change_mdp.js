import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(URL);
console.log(SERVICE_ROLE_KEY ? 'clé trouvée' : 'clé absente');

const admin = createClient(URL, SERVICE_ROLE_KEY);

const { data, error } = await admin.auth.admin.updateUserById(
  '266e7bbe-f18c-4d4f-87cc-98ef8a2fcae5',
  { password: 'tatata' }
);

console.log({ data, error });