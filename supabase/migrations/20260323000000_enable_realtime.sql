-- Enable Realtime on articles table
-- This allows the dashboard to receive live updates when articles are inserted or updated
-- Without this, the Realtime subscription won't receive any events

-- Enable Realtime publication for articles table
ALTER PUBLICATION supabase_realtime ADD TABLE articles;

-- Optional: Enable Realtime for tags table (if you want live tag updates in the future)
-- ALTER PUBLICATION supabase_realtime ADD TABLE tags;

-- Note: Realtime is now enabled for the articles table
-- The dashboard will receive events for:
-- - INSERT: When a new article is saved
-- - UPDATE: When processing status changes (pending → processing → completed)
