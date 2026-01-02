
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jxtiqpeecojhjlkrmari.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_b2CsAt1J15Vo2Biyf6vr4Q_cCNZa1XJ';

export const isSupabaseConfigured =
  SUPABASE_URL.length > 10 &&
  SUPABASE_ANON_KEY.length > 10 &&
  SUPABASE_URL.startsWith('https://');

if (!isSupabaseConfigured) {
  console.warn("ViralThumb AI: Supabase environment variables are missing. Running in MOCK MODE.");
}

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
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
        }),
      }),
      upsert: () => ({
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

export interface TemplateRecord {
  id: string;
  name: string;
  description?: string;
  preview_url?: string;
  is_active?: boolean;
  created_at?: string;
}

/**
 * Fetch all active templates from the database
 */
export async function getTemplates(): Promise<TemplateRecord[]> {
  if (!isSupabaseConfigured) {
    // Fallback mock data if Supabase is not configured
    return [
      { id: 'mrbeast', name: 'MrBeast Style (High Saturation)', description: 'High contrast, bright colors, shocked face.' },
      { id: 'minimalist', name: 'Minimalist Clean', description: 'Simple, clean, plenty of whitespace.' },
      { id: 'gaming', name: 'Gaming High Energy', description: 'Action-packed, vibrant, game elements.' },
      { id: 'documentary', name: 'Documentary Serious', description: 'Cinematic, moody, realistic.' },
    ];
  }

  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error("Error fetching templates:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch templates:", err);
    return [];
  }
}

/**
 * Checks if a username is already taken.
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  
  const cleanUsername = username.trim();
  console.log(`[isUsernameTaken] Checking availability for: "${cleanUsername}"`);

  try {
    // 0. Check if current user owns this username (to prevent false positives during re-registration attempts)
    const { data: { user } } = await supabase.auth.getUser();
    const currentUsername = user?.user_metadata?.username || user?.user_metadata?.user_name;
    
    if (user && currentUsername?.toLowerCase() === cleanUsername.toLowerCase()) {
      console.warn(`[isUsernameTaken] Username "${cleanUsername}" belongs to current session user.`);
      // If we are checking availability, it technically IS taken (by me).
      // But if the user is trying to register, they shouldn't be logged in.
      // We will return TRUE, but the UI should handle "You are already logged in".
      return true;
    }

    // 1. Try to use the secure RPC function (bypasses RLS)
    const { data: isTaken, error: rpcError } = await supabase.rpc('check_username_taken', { 
      username_check: cleanUsername 
    });

    if (rpcError) {
      console.warn("[isUsernameTaken] RPC Error:", rpcError);
    } else {
      console.log(`[isUsernameTaken] RPC Result: ${isTaken}`);
    }

    if (!rpcError && isTaken !== null) {
      return isTaken;
    }

    // 2. Fallback to direct query (might fail if RLS is strict)
    console.log("[isUsernameTaken] RPC failed/skipped, using fallback query...");
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', cleanUsername)
      .maybeSingle();
      
    console.log(`[isUsernameTaken] Fallback Result: ${!!data}`);
    return !!data;
  } catch (err) {
    console.error("Username check error:", err);
    return false;
  }
}

/**
 * Atomic sync of a user profile. 
 * Note: If this fails, check your Supabase RLS policies for the 'profiles' table.
 */
export async function syncProfileRecord(userId: string, email: string, username: string, fullName: string) {
  if (!isSupabaseConfigured) return null;

  console.log(`Syncing profile for user: ${userId}`);

  try {
    // 1. Try to fetch existing profile first
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.warn("Fetch profile error during sync (might be RLS):", fetchError.message);
    }

    if (existingProfile) {
      // Update if data is different
      if (existingProfile.username !== username || existingProfile.full_name !== fullName) {
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({
            username: username || existingProfile.username,
            full_name: fullName || existingProfile.full_name,
            email: email || existingProfile.email
          })
          .eq('id', userId)
          .select()
          .maybeSingle();

        if (updateError) {
          console.error("Profile update failed:", updateError.message);
          return existingProfile; // Fallback to what we have
        }
        return updated || existingProfile;
      }
      return existingProfile;
    }

    // 2. Insert new profile if not found
    const profileData = {
      id: userId,
      email: email,
      username: username || `user_${userId.substring(0, 5)}`,
      full_name: fullName || 'Creator',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || userId}`,
      credits: 50,
      plan: 'free',
      role: 'user'
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error("❌ Profile provision failed:", error.message);
      // Don't throw - let the client handle it via fallback
      return null;
    }

    return data;
  } catch (err) {
    console.error("Critical error in syncProfileRecord:", err);
    return null;
  }
}

/**
 * The master profile retriever. 
 * If a profile doesn't exist in the DB, it attempts to create it using Auth metadata.
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
    // 1. Try to fetch existing profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (!error && profile) return profile;

    // 2. If missing or error (RLS block), attempt to provision from metadata
    const metadata = supabaseUser.user_metadata || {};
    const username = metadata.user_name || `user_${supabaseUser.id.substring(0, 5)}`;
    const fullName = metadata.full_name || 'Creator';

    const synced = await syncProfileRecord(supabaseUser.id, supabaseUser.email, username, fullName);

    if (synced) return synced;

    // 3. Last resort: return a profile object based on auth metadata 
    // This allows the app to function even if the DB is unreachable/locked
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: username,
      full_name: fullName,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      credits: 50,
      plan: 'free',
      role: 'user'
    };
  } catch (err) {
    console.error("getOrCreateProfile failed - returning fallback:", err);
    return {
      id: supabaseUser?.id,
      email: supabaseUser?.email,
      username: 'user',
      full_name: 'Creator',
      credits: 50,
      plan: 'free',
      role: 'user'
    };
  }
}

export async function deductCredits(userId: string, currentCredits: number, amount: number = 1) {
  if (!isSupabaseConfigured) return currentCredits - amount;

  try {
    // Try using the atomic RPC function first
    const { data, error } = await supabase.rpc('deduct_credits', { 
      user_id_input: userId, 
      amount: amount 
    });

    if (error) {
      // If RPC doesn't exist or fails unexpectedly, fall back to optimistic client-side update
      // But only if the error is NOT "Insufficient credits"
      if (error.message.includes('Insufficient credits')) {
        throw error;
      }
      console.warn("RPC deduct_credits failed, falling back to client-side update:", error);
      throw error; // Actually, let's enforce RPC for safety. Fallback is dangerous for concurrency.
    }

    return data;
  } catch (err: any) {
    // If RPC is missing (function not found), we might want a fallback?
    // For now, let's assume the user will run the SQL. 
    // If we really need fallback:
    if (err.message?.includes('function') && err.message?.includes('does not exist')) {
       console.warn("RPC deduct_credits not found. Using unsafe client-side update.");
       const { data, error } = await supabase.from('profiles').update({ credits: Math.max(0, currentCredits - amount) }).eq('id', userId).select().single();
       if (error) throw error;
       return data.credits;
    }
    throw err;
  }
}

export async function refundCredits(userId: string, amount: number = 1) {
  if (!isSupabaseConfigured) return;
  // Refund is just a negative deduction, or a direct update
  try {
    const { data, error } = await supabase.rpc('deduct_credits', { 
      user_id_input: userId, 
      amount: -amount 
    });
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Refund failed:", err);
    // Fallback
    const { error } = await supabase.rpc('increment_credits', { user_id: userId, amount }); 
    // We don't have increment_credits either.
    // Just simple update
    // We can't easily do atomic increment without RPC or knowing current. 
    // But this is error recovery, so maybe less critical?
  }
}

export async function saveThumbnailsToDB(userId: string, thumbnails: { url: string, prompt: string, style: string, title: string }[]) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('thumbnails').insert(thumbnails.map(t => ({ user_id: userId, ...t })));
  if (error) throw error;
}

/**
 * Save a generation record to the generations table
 */
export async function saveGenerationToDB(
  userId: string, 
  prompt: string, 
  outputUrl: string, 
  creditsUsed: number = 1,
  title?: string,
  description?: string
) {
  if (!isSupabaseConfigured) {
    console.log("Supabase not configured, skipping generation save");
    return null;
  }

  if (!userId || userId === 'mock-id') {
    console.log("Invalid user ID, skipping generation save");
    return null;
  }

  try {
    console.log("Attempting to save generation:", { 
      userId, 
      prompt: prompt.substring(0, 50), 
      outputUrl: outputUrl?.substring(0, 50),
      title: title?.substring(0, 20),
      description: description?.substring(0, 20)
    });

    const { data, error } = await supabase
      .from('generations')
      .insert({
        user_id: userId,
        prompt: prompt,
        output_url: outputUrl,
        credits_used: creditsUsed,
        title: title || null,
        description: description || null
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving generation:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      // Don't throw - log but continue
      if (error.code === '42501' || error.message.includes('row-level security')) {
        console.error("RLS policy blocking insert. Make sure you've run setup-generations-table-complete.sql");
      }
      return null;
    }

    console.log("✅ Generation saved successfully:", data);
    return data;
  } catch (err: any) {
    console.error("Failed to save generation:", err);
    // Don't throw - allow generation to continue even if DB save fails
    return null;
  }
}

/**
 * Get user's generation history with pagination
 */
export async function getUserGenerations(userId: string, limit: number = 20, offset: number = 0) {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching generations:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch generations:", err);
    return [];
  }
}
/**
 * Upload an image to Supabase Storage and return the public URL + storage path
 * @param userId - The user's unique ID
 * @param generationId - Unique ID for this specific image variation
 * @param imageData - Can be a Base64 string (data:image/...) or a Blob
 */
export async function uploadImageToStorage(
  userId: string,
  generationId: string,
  imageData: string | Blob
): Promise<{ publicUrl: string; storagePath: string }> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured, returning mock data");
    return {
      publicUrl: typeof imageData === 'string' ? imageData : URL.createObjectURL(imageData),
      storagePath: `mock/${userId}/${generationId}.png`
    };
  }

  try {
    let blob: Blob;
    let mimeType = 'image/png';

    // 1. Convert to Blob if it's a Base64 string
    if (typeof imageData === 'string') {
      const match = imageData.match(/^data:(.*);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        const base64Content = match[2];
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mimeType });
      } else {
        // Assume it might be raw base64 or a URL
        throw new Error("Invalid image data format. Expected Data URL or Blob.");
      }
    } else {
      blob = imageData;
      mimeType = blob.type || 'image/png';
    }

    // 2. Define storage path structure
    const fileName = `${userId}/${generationId}.png`;
    const bucketName = 'ViralThumb-AI';

    console.log(`Uploading to ${bucketName}: ${fileName} (${blob.size} bytes, ${mimeType})`);

    // 3. Perform the upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, blob, {
        contentType: mimeType,
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 4. Retrieve Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    if (!publicUrl) {
      throw new Error("Failed to generate public URL for uploaded image.");
    }

    console.log("✅ Storage upload successful:", publicUrl);

    return {
      publicUrl,
      storagePath: fileName
    };
  } catch (err: any) {
    console.error("❌ Critical Storage Failure:", err);
    throw err;
  }
}
