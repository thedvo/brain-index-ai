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
	console.log(`[parseArticleFromURL] Starting parse for: ${url}`)

	// Step 1: Fetch HTML (with archive fallback)
	console.log('[parseArticleFromURL] Step 1: Fetching HTML...')
	const { html, finalUrl } = await fetchArticleHTML(url)
	console.log(
		`[parseArticleFromURL] Fetched ${html.length} bytes from ${finalUrl}`
	)

	// Step 2: Extract original URL if this is an archive
	console.log('[parseArticleFromURL] Step 2: Extracting original URL...')
	const originalUrl = extractOriginalURL(finalUrl) || finalUrl
	console.log(`[parseArticleFromURL] Original URL: ${originalUrl}`)

	// Step 3: Extract article content using Readability
	console.log('[parseArticleFromURL] Step 3: Extracting article content...')
	const extracted = await extractArticle(html, originalUrl)
	if (!extracted) {
		throw new Error('Failed to extract article content')
	}
	console.log(
		`[parseArticleFromURL] Extracted: "${extracted.title}" (${extracted.wordCount} words)`
	)

	// Step 4: Extract metadata (author, date, description, etc.)
	console.log('[parseArticleFromURL] Step 4: Extracting metadata...')
	const metadata = await extractMetadata(html, originalUrl)
	console.log(`[parseArticleFromURL] Metadata extracted`)

	// Step 5: Sanitize HTML content for safe storage
	console.log('[parseArticleFromURL] Step 5: Sanitizing HTML...')
	const sanitizedContent = sanitizeArticleHTML(extracted.content)
	console.log(
		`[parseArticleFromURL] Sanitized to ${sanitizedContent.length} chars`
	)

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
