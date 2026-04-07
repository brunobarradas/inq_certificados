import { createClient } from '@supabase/supabase-js';

// Lazy singletons — evita crash no build sem env vars
function makePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
  );
}

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

let _pub: ReturnType<typeof makePublic> | null = null;
let _adm: ReturnType<typeof makeAdmin> | null = null;

export function getSupabasePublic() {
  if (!_pub) _pub = makePublic();
  return _pub;
}

export function getSupabaseAdmin() {
  if (!_adm) _adm = makeAdmin();
  return _adm;
}
