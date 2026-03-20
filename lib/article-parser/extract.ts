/**
 * Article content extraction using Mozilla Readability
 * Extracts clean article content from HTML
 */

import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'

export interface ExtractedArticle {
	title: string
	content: string // HTML content
	textContent: string // Plain text version
	excerpt: string
	byline: string | null // Author
	siteName: string | null
	publishedTime: string | null
	wordCount: number
}

/**
 * Extracts article content from HTML using Readability
 * @param html - Raw HTML from the article page
 * @param url - Original URL (helps Readability with relative links)
 * @returns Extracted and cleaned article data
 */
export async function extractArticle(
	html: string,
	url: string
): Promise<ExtractedArticle | null> {
	try {
		// Create a DOM from the HTML
		const dom = new JSDOM(html, { url })
		const document = dom.window.document

		// Use Readability to extract article content
		const reader = new Readability(document, {
			// Keep class names for potential styling
			keepClasses: false,
			// Disable char threshold to handle short articles
			charThreshold: 0,
		})

		const article = reader.parse()

		if (!article) {
			throw new Error('Readability failed to parse article')
		}

		// Calculate word count from plain text
		const wordCount = (article.textContent || '')
			.split(/\s+/)
			.filter((word) => word.length > 0).length

		return {
			title: article.title || 'Untitled',
			content: article.content || '', // HTML
			textContent: article.textContent || '', // Plain text
			excerpt: article.excerpt || '',
			byline: article.byline ?? null, // Author
			siteName: article.siteName ?? null,
			publishedTime: null, // Will be enhanced by metadata extractor
			wordCount,
		}
	} catch (error) {
		console.error('Failed to extract article:', error)
		return null
	}
}

/**
 * Extracts just the plain text content (no HTML)
 * Useful for AI processing where HTML tags aren't needed
 */
export function extractPlainText(html: string): string {
	const dom = new JSDOM(html)
	return dom.window.document.body.textContent || ''
}
