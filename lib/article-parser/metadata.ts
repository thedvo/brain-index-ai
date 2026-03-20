/**
 * Article metadata extraction using Metascraper
 * Extracts author, published date, description, images, etc.
 */

import metascraper from 'metascraper'
import metascraperAuthor from 'metascraper-author'
import metascraperDate from 'metascraper-date'
import metascraperDescription from 'metascraper-description'
import metascraperImage from 'metascraper-image'
import metascraperTitle from 'metascraper-title'
import metascraperUrl from 'metascraper-url'

// Initialize metascraper with plugins
const scraper = metascraper([
	metascraperAuthor(),
	metascraperDate(),
	metascraperDescription(),
	metascraperImage(),
	metascraperTitle(),
	metascraperUrl(),
])

export interface ArticleMetadata {
	title?: string
	author?: string
	date?: string // ISO date string
	description?: string
	image?: string
	url?: string
	publisher?: string
}

/**
 * Extracts metadata from HTML using Open Graph, Twitter Cards, and other meta tags
 * @param html - Raw HTML from the article page
 * @param url - Original URL of the article
 * @returns Extracted metadata
 */
export async function extractMetadata(
	html: string,
	url: string
): Promise<ArticleMetadata> {
	try {
		const metadata = await scraper({ html, url })

		return {
			title: metadata.title || undefined,
			author: metadata.author || undefined,
			date: metadata.date || undefined,
			description: metadata.description || undefined,
			image: metadata.image || undefined,
			url: metadata.url || url,
		}
	} catch (error) {
		console.error('Failed to extract metadata:', error)
		return { url }
	}
}

/**
 * Parses published date string into ISO format
 * Handles various date formats from metadata
 */
export function parsePublishedDate(
	dateString: string | undefined
): string | null {
	if (!dateString) return null

	try {
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return null
		return date.toISOString()
	} catch {
		return null
	}
}
