-- Add image_url column to articles table for cover images
-- This is used to display article thumbnails/previews in the dashboard

ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN articles.image_url IS 'URL of article cover image/thumbnail extracted from og:image metadata';
