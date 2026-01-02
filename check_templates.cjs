const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jxtiqpeecojhjlkrmari.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_b2CsAt1J15Vo2Biyf6vr4Q_cCNZa1XJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTemplatesSchema() {
  console.log("Checking 'templates' table schema...");
  
  // Try to select one record to see the structure
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("Error fetching templates:", error);
  } else {
    console.log("Templates sample data:", data);
    if (data && data.length > 0) {
      console.log("Keys found:", Object.keys(data[0]));
    } else {
      console.log("No templates found in table.");
    }
  }
}

checkTemplatesSchema().catch(console.error);
