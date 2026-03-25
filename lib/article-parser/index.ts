/**
 * Main article parser - combines fetch, extract, metadata, and sanitize
 * Provides unified interface for parsing articles from URLs
 */

import { fetchArticleHTML, extractOriginalURL } from './fetch'
import { extractArticle } from './extract'
import { sanitizeArticleHTML } from './sanitize'
import { extractMetadata, parsePublishedDate } from './metadata'

export interface ParsedArticle {
	// Content
	title: string
	content: string // Sanitized HTML
	excerpt: string
	wordCount: number

	// Metadata
	author: string | null
	publishedDate: string | null // ISO string
	url: string // Original URL (not archive)

	// Optional enrichment
	description?: string
	image?: string
}

/**
 * Parses an article from a URL (supports regular URLs and archive services)
 * @param url - Article URL or archive URL
 * @returns Fully parsed and sanitized article data
 */
export async function parseArticleFromURL(url: string): Promise<ParsedArticle> {
	// Step 1: Fetch HTML (with archive fallback)
	const { html, finalUrl } = await fetchArticleHTML(url)

	// Step 2: Extract original URL if this is an archive
	const originalUrl = extractOriginalURL(finalUrl) || finalUrl

	// Step 3: Extract article content using Readability
	const extracted = await extractArticle(html, originalUrl)
	if (!extracted) {
		throw new Error('Failed to extract article content')
	}

	// Step 4: Extract metadata (author, date, description, etc.)
	const metadata = await extractMetadata(html, originalUrl)

	// Step 5: Sanitize HTML content for safe storage
	const sanitizedContent = sanitizeArticleHTML(extracted.content)

	// Step 6: Merge all data
	const author = metadata.author || extracted.byline || null
	const publishedDate = parsePublishedDate(metadata.date) || null

	console.log(
		`Article parsed successfully: "${metadata.title || extracted.title}" - ${extracted.wordCount} words, ${sanitizedContent.length} chars (sanitized HTML)`
	)

	return {
		title: metadata.title || extracted.title,
		content: sanitizedContent,
		excerpt: metadata.description || extracted.excerpt,
		wordCount: extracted.wordCount,
		author,
		publishedDate,
		url: originalUrl,
		description: metadata.description,
		image: metadata.image,
	}
}

// Re-export utilities for direct use
export { fetchArticleHTML, extractOriginalURL } from './fetch'
export { extractArticle, extractPlainText } from './extract'
export { sanitizeArticleHTML, stripHTML, getCharacterCount } from './sanitize'
export { extractMetadata, parsePublishedDate } from './metadata'
