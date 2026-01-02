const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jxtiqpeecojhjlkrmari.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_b2CsAt1J15Vo2Biyf6vr4Q_cCNZa1XJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkGenerationsSchema() {
  console.log("Checking 'generations' table schema...");
  
  // Try to insert a dummy record to see if columns exist (or just select)
  // Selecting * and limiting 1 is better to see keys
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("Error fetching generations:", error);
  } else {
    console.log("Generations sample data:", data);
    if (data && data.length > 0) {
      console.log("Keys found:", Object.keys(data[0]));
    } else {
      console.log("No generations found, cannot infer schema from data. Trying to inspect error on invalid column select...");
      const { error: colError } = await supabase
        .from('generations')
        .select('title, description')
        .limit(1);
      
      if (colError) {
        console.log("Column check result:", colError.message);
      } else {
        console.log("Columns 'title' and 'description' seem to exist.");
      }
    }
  }
}

checkGenerationsSchema().catch(console.error);
