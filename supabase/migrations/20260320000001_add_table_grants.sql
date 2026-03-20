-- Fix: Grant table-level permissions to authenticated role
-- Without these grants, RLS policies cannot be evaluated
-- The 'authenticated' role is used by logged-in Supabase users

GRANT ALL ON articles TO authenticated;
GRANT ALL ON tags TO authenticated;
GRANT ALL ON article_tags TO authenticated;
