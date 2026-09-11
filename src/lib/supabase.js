// src/lib/supabase.js
// The dashboard's Supabase client — the same project the ResiFix KNUST
// mobile app talks to. That shared project is what connects the two apps:
// a report filed on a student's phone lands in the same `reports` table
// this dashboard reads.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase is not configured.\n\n' +
      'Copy .env.example to .env and set REACT_APP_SUPABASE_URL and ' +
      'REACT_APP_SUPABASE_ANON_KEY from your project dashboard ' +
      '(Project Settings -> API), then restart `npm start`.\n\n' +
      'Create React App only reads .env at startup, so a running dev server ' +
      'will not pick up changes on its own.'
  );
}

const AUTH_STORAGE_KEY = 'resifix-admin-auth';
const LEGACY_AUTH_STORAGE_KEY = 'snapfix-admin-auth';

/**
 * The auth storage key was renamed with the ResiFix KNUST rebrand. supabase-js
 * reads this key once, at client construction, so without this every admin who
 * was already signed in would be bounced to the login screen the first time
 * they loaded the renamed build. Carrying the stored session across keeps them
 * signed in; the old key is left untouched so the change stays reversible.
 */
const adoptLegacySession = () => {
  try {
    if (localStorage.getItem(AUTH_STORAGE_KEY) !== null) return;
    const legacy = localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
    if (legacy === null) return;
    JSON.parse(legacy); // a corrupt blob is not worth carrying over
    localStorage.setItem(AUTH_STORAGE_KEY, legacy);
  } catch (err) {
    // Storage disabled or private mode — signing in again is the fallback.
  }
};

adoptLegacySession();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: AUTH_STORAGE_KEY,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

export default supabase;
