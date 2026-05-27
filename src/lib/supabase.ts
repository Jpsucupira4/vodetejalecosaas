import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://becipbicizqgexlpkjzb.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlY2lwYmljaXpxZ2V4bHBranpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzc2MzIsImV4cCI6MjA5NDg1MzYzMn0.Pmxk2FJg8M8GQiulkzjcfBKt27wU0JodDLmeF8WKsO4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
