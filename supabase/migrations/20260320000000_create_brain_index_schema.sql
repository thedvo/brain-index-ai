-- Articles table with AI analysis and user notes
-- Using gen_random_uuid() - built-in to PostgreSQL 13+, no extension needed
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  
  -- Parsed content
  title TEXT NOT NULL,
  author TEXT,
  published_date TIMESTAMPTZ,
  content TEXT NOT NULL, -- Sanitized HTML
  word_count INTEGER,
  
  -- AI analysis (READ-ONLY, PERMANENT once set)
  ai_summary TEXT,
  ai_key_points JSONB DEFAULT '[]'::jsonb,
  ai_highlights JSONB DEFAULT '[]'::jsonb,
  
  -- User data
  user_notes TEXT,
  
  -- Status tracking
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate saves per user
  UNIQUE(user_id, url)
);

-- User-defined tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate tag names per user
  UNIQUE(user_id, tag_name)
);

-- Many-to-many relationship between articles and tags
CREATE TABLE article_tags (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (article_id, tag_id)
);

-- Indexes for performance
-- Speeds up: "SELECT * FROM articles WHERE user_id = ?" (fetch user's articles)
CREATE INDEX idx_articles_user_id ON articles(user_id);

-- Speeds up: "ORDER BY created_at DESC" (sort by newest first)
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);

-- Speeds up: "WHERE processing_status = 'pending'" (filter by status)
CREATE INDEX idx_articles_processing_status ON articles(processing_status);

-- Speeds up: "SELECT * FROM tags WHERE user_id = ?" (fetch user's tags)
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- Speeds up: "SELECT tags WHERE article_id = ?" (get all tags for an article)
CREATE INDEX idx_article_tags_article_id ON article_tags(article_id);

-- Speeds up: "SELECT articles WHERE tag_id = ?" (get all articles with a tag)
CREATE INDEX idx_article_tags_tag_id ON article_tags(tag_id);

-- RLS Policies: Users can only access their own data
-- Purpose: Enforce multi-tenant security at the database level
-- Ensures User A cannot see, modify, or delete User B's data even if they have the ID
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;

-- Articles policies
-- Purpose: Only show articles where user_id matches the authenticated user
-- Use case: Dashboard only displays current user's saved articles
CREATE POLICY "Users can view their own articles"
  ON articles FOR SELECT
  USING (auth.uid() = user_id);

-- Purpose: Only allow inserts where user_id matches authenticated user
-- Use case: User can only create articles under their own account
CREATE POLICY "Users can insert their own articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Purpose: Only allow updates to articles owned by the authenticated user
-- Use case: User can only edit their own notes, not others' articles
CREATE POLICY "Users can update their own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Purpose: Only allow deleting articles owned by the authenticated user
-- Use case: User can only delete their own saved articles
CREATE POLICY "Users can delete their own articles"
  ON articles FOR DELETE
  USING (auth.uid() = user_id);

-- Tags policies
-- Purpose: Each user has their own isolated tag collection
-- Use case: User A's "Important" tag is separate from User B's "Important" tag
CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- Article_tags policies (join table - check ownership through article)
-- Purpose: Users can only tag their own articles (ownership verified via articles table)
-- Use case: Prevents User A from tagging User B's articles
CREATE POLICY "Users can view their own article tags"
  ON article_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_tags.article_id
      AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own article tags"
  ON article_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_tags.article_id
      AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own article tags"
  ON article_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_tags.article_id
      AND articles.user_id = auth.uid()
    )
  );

-- Function to auto-update updated_at timestamp
-- Purpose: Automatically track when an article was last modified
-- Use case: Show "Last edited: 2 hours ago" without manual timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update articles.updated_at
-- Purpose: Call update_updated_at_column() whenever an article row is updated
-- Use case: When user edits notes, updated_at automatically refreshes
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
