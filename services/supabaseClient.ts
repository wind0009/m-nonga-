
import { createClient } from '@supabase/supabase-js';

// Identifiants récupérés de ton compte Supabase
const supabaseUrl = 'https://pdntlbqibknuiunlevks.supabase.co';
const supabaseAnonKey = 'sb_publishable_yC68N251zawFjfVjdqcF8A_fbjLT7im';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
