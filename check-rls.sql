-- Run this in Supabase SQL Editor to check RLS policies
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('articles', 'tags', 'article_tags');

-- Check existing policies on articles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'articles';

-- If no policies show up, you need to re-run the migration
-- The policies weren't created properly
