import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://djjqzapkiuvuszjuwnwv.supabase.co'
const supabaseKey = 'sb_publishable_XlUBadP8VZYpuG60gSQLXw_v70_UZKr'

export const supabase = createClient(supabaseUrl, supabaseKey)