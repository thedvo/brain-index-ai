/**
 * Article processing states throughout the AI analysis lifecycle
 */
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Used to link AI-generated summaries back to exact article passages
 */
export interface Highlight {
	citationId: string
	sourceText: string // Exact text from article being cited
	startChar: number // Character position where highlight starts
	endChar: number // Character position where highlight ends
	referencedBy: string[] // Which summary sections reference this highlight
}

/**
 * AI-generated bullet point summarizing a key concept from the article
 * Each point includes citations linking back to source text in the article
 */
export interface KeyPoint {
	point: string
	citations: string[]
}

/**
 * Represents a saved web article with all associated metadata and AI-generated insights
 */
export interface Article {
	id: string
	user_id: string
	url: string

	// Parsed content
	title: string
	author?: string
	published_date?: string
	content: string // Sanitized HTML of article body
	word_count?: number

	// AI analysis (READ-ONLY, generated once per article)
	ai_summary?: string // AI-generated summary with citations
	ai_key_points: KeyPoint[] // Important bullet points
	ai_highlights: Highlight[] // Source text excerpts with positions

	// User data
	user_notes?: string // Personal notes about the article

	// Status tracking
	processing_status: ProcessingStatus

	// Timestamps
	created_at: string
	updated_at: string
}

/**
 * User-defined tag for organizing articles
 * Each user has their own isolated tag collection (enforced by RLS)
 */
export interface Tag {
	id: string
	user_id: string
	tag_name: string
	color: string // Hex color for UI display (default: #3b82f6)
	created_at: string
}

/**
 * Join table linking articles to tags (many-to-many relationship)
 * Allows one article to have multiple tags, one tag to apply to multiple articles
 */
export interface ArticleTag {
	article_id: string
	tag_id: string
	created_at: string
}

/**
 * Type for inserting new articles into the database
 * Omits auto-generated fields (id, timestamps) but allows manual override
 */
export type ArticleInsert = Omit<
	Article,
	'id' | 'created_at' | 'updated_at'
> & {
	id?: string
	created_at?: string
	updated_at?: string
}

/**
 * Type for inserting new tags into the database
 * Omits auto-generated fields (id, created_at) but allows manual override
 */
export type TagInsert = Omit<Tag, 'id' | 'created_at'> & {
	id?: string
	created_at?: string
}

/**
 * Type for inserting new article-tag relationships into the database
 * Omits auto-generated created_at but allows manual override
 */
export type ArticleTagInsert = Omit<ArticleTag, 'created_at'> & {
	created_at?: string
}

/**
 * Database schema type for Supabase client
 * This ensures TypeScript knows about all our tables and their columns
 */
export type Database = {
	public: {
		Tables: {
			articles: {
				Row: Article
				Insert: ArticleInsert
				Update: Partial<Omit<Article, 'id' | 'user_id' | 'created_at'>>
			}
			tags: {
				Row: Tag
				Insert: TagInsert
				Update: Partial<Omit<Tag, 'id' | 'user_id' | 'created_at'>>
			}
			article_tags: {
				Row: ArticleTag
				Insert: ArticleTagInsert
				Update: Partial<ArticleTag>
			}
		}
		Views: Record<string, never>
		Functions: Record<string, never>
		Enums: Record<string, never>
	}
}
