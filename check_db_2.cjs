const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jxtiqpeecojhjlkrmari.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_b2CsAt1J15Vo2Biyf6vr4Q_cCNZa1XJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("Checking DB for 'testuser1'...");
  
  const username = 'testuser1';

  // 1. Check RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc('check_username_taken', { 
    username_check: username 
  });
  console.log(`RPC check_username_taken('${username}'):`, rpcData, rpcError ? `Error: ${rpcError.message}` : '');

  // 2. Check Profiles Table
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username);
  
  console.log(`Profile check ('${username}'):`, profileData);
  
  // List ALL profiles (limit 10)
  const { data: allProfiles } = await supabase.from('profiles').select('username').limit(10);
  console.log("First 10 profiles:", allProfiles);
}

main().catch(console.error);
