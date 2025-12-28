
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  SUPABASE_URL.length > 10 && 
  SUPABASE_ANON_KEY.length > 10 && 
  SUPABASE_URL.startsWith('https://');

export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: { message: "Supabase not configured" } }),
        signUp: async () => ({ error: { message: "Supabase not configured" } }),
        signInWithOAuth: async () => ({ error: { message: "Supabase not configured" } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { code: 'PGRST116' } }),
            maybeSingle: async () => ({ data: null, error: null }),
            order: () => ({ limit: async () => ({ data: [], error: null }) }),
          }),
        }),
        upsert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: null, error: null })
            })
          })
        })
      })
    } as any;

/**
 * Checks if a username is already taken in the public.profiles table.
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Ensures a profile record exists in the public.profiles table using an UPSERT strategy.
 */
export async function syncProfileRecord(userId: string, email: string, username: string, fullName: string) {
  if (!isSupabaseConfigured) return null;

  const profileData = {
    id: userId,
    email: email,
    username: username,
    full_name: fullName,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    credits: 50, // Default starting credits
    plan: 'free',
    role: 'user'
  };

  // We use upsert to prevent errors if the profile was already created (e.g. by a database trigger)
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error("Critical: Error syncing profile to database:", error);
    throw error;
  }
  return data;
}

/**
 * The primary synchronization engine. It detects if a profile is missing for an 
 * authenticated user and provisions it using Auth Metadata.
 */
export async function getOrCreateProfile(supabaseUser: any) {
  if (!isSupabaseConfigured || !supabaseUser) {
    return {
      id: supabaseUser?.id || 'mock-id',
      full_name: 'Creator Guest',
      username: 'guest_creator',
      email: supabaseUser?.email || 'guest@example.com',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=guest`,
      credits: 50,
      plan: 'free',
      role: 'user'
    };
  }

  try {
    // 1. Attempt to fetch existing profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (!error && profile) return profile;

    // 2. If profile is missing, create it using Auth metadata
    // This is the most reliable way to handle registration across different Auth providers/settings
    if (error && (error.code === 'PGRST116' || error.message.includes('No rows found'))) {
      const metadata = supabaseUser.user_metadata || {};
      const email = supabaseUser.email || '';
      const username = metadata.user_name || metadata.preferred_username || `user_${Math.floor(Math.random() * 10000)}`;
      const fullName = metadata.full_name || metadata.name || 'Creator';

      return await syncProfileRecord(supabaseUser.id, email, username, fullName);
    }
    
    throw error;
  } catch (err) {
    console.error("Sync Failure in getOrCreateProfile:", err);
    throw err;
  }
}

export async function deductCredits(userId: string, currentCredits: number) {
  if (!isSupabaseConfigured) return currentCredits - 1;
  const { data, error } = await supabase.from('profiles').update({ credits: Math.max(0, currentCredits - 1) }).eq('id', userId).select().single();
  if (error) throw error;
  return data.credits;
}

export async function saveThumbnailsToDB(userId: string, thumbnails: { url: string, prompt: string, style: string, title: string }[]) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('thumbnails').insert(thumbnails.map(t => ({ user_id: userId, ...t })));
  if (error) throw error;
}
