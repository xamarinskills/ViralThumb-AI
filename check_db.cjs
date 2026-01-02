const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jxtiqpeecojhjlkrmari.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_b2CsAt1J15Vo2Biyf6vr4Q_cCNZa1XJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("Checking DB state...");
  
  const username = 'TESTUSER123';
  const email = 'testuser1@example.com';

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

  // 3. Check Email in Profiles
  const { data: emailData } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email);
    
  console.log(`Email check ('${email}'):`, emailData);
}

main().catch(console.error);
