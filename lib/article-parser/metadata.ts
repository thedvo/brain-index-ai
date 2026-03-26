/**
 * Article metadata extraction from HTML meta tags
 * Extracts author, published date, description, images, etc.
 */

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
 * Extracts metadata from HTML using Open Graph, Twitter Cards, and standard meta tags
 * @param html - Raw HTML from the article page
 * @param url - Original URL of the article
 * @returns Extracted metadata
 */
export async function extractMetadata(
	html: string,
	url: string
): Promise<ArticleMetadata> {
	try {
		// Dynamic import to avoid ESM/CommonJS conflicts
		const { JSDOM } = await import('jsdom')
		const dom = new JSDOM(html)
		const document = dom.window.document

		// Helper to get meta tag content by name or property
		const getMetaContent = (...attrs: string[]): string | null => {
			for (const attr of attrs) {
				const meta = document.querySelector(
					`meta[name="${attr}"], meta[property="${attr}"]`
				)
				const content = meta?.getAttribute('content')
				if (content) return content
			}
			return null
		}

		// Extract metadata from various sources (Open Graph, Twitter Cards, standard meta tags)
		const metadata: ArticleMetadata = {
			// Title: og:title > twitter:title > meta title > document title
			title:
				getMetaContent('og:title', 'twitter:title') ||
				document.querySelector('title')?.textContent ||
				undefined,

			// Author: article:author > author > og:article:author
			author:
				getMetaContent(
					'author',
					'article:author',
					'og:article:author',
					'twitter:creator'
				) || undefined,

			// Description: og:description > twitter:description > description
			description:
				getMetaContent(
					'og:description',
					'twitter:description',
					'description'
				) || undefined,

			// Image: og:image > twitter:image
			image: getMetaContent('og:image', 'twitter:image', 'image') || undefined,

			// Site name/publisher: og:site_name > publisher
			publisher: getMetaContent('og:site_name', 'publisher') || undefined,

			// URL defaults to provided URL
			url,
		}

		return metadata
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
