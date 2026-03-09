-- Add tsvector search index for full-text search
CREATE INDEX IF NOT EXISTS "Post_search_idx" ON "Post"
USING GIN (
  (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("excerpt", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("content", '')), 'C')
  )
);
