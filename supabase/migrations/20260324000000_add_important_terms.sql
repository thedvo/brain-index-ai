-- Add ai_important_terms column to articles table
-- Stores AI-identified key terms/topics enriched with Wikipedia links and summaries

ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS ai_important_terms JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the field
COMMENT ON COLUMN articles.ai_important_terms IS 
'Array of important terms/topics from the article enriched with Wikipedia context. Each term includes: term (string), wikipediaUrl (string), summary (string), thumbnail (string)';
