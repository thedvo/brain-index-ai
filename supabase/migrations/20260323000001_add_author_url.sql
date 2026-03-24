-- Add author_url column to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS author_url TEXT;

COMMENT ON COLUMN articles.author_url IS 'URL to author profile page';
