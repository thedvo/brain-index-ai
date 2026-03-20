/**
 * HTML sanitization for article content
 * Ensures safe, clean HTML for database storage and display
 */

import sanitizeHtml from 'sanitize-html'

/**
 * Sanitizes article HTML content
 * Removes scripts, dangerous attributes, and normalizes HTML
 * @param html - Raw HTML content from article
 * @returns Sanitized HTML safe for storage and display
 */
export function sanitizeArticleHTML(html: string): string {
	return sanitizeHtml(html, {
		// Allow common article formatting tags
		allowedTags: [
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'p',
			'br',
			'hr',
			'blockquote',
			'pre',
			'code',
			'ul',
			'ol',
			'li',
			'strong',
			'em',
			'b',
			'i',
			'u',
			'a',
			'img',
			'figure',
			'figcaption',
			'table',
			'thead',
			'tbody',
			'tr',
			'th',
			'td',
			'div',
			'span',
		],

		// Allowed attributes per tag
		allowedAttributes: {
			a: ['href', 'title', 'target', 'rel'],
			img: ['src', 'alt', 'title', 'width', 'height'],
			code: ['class'], // For syntax highlighting (e.g., language-javascript)
			pre: ['class'],
			'*': ['class', 'id'], // Allow class/id on all tags for styling
		},

		// Disallow relative URLs (security)
		allowedSchemes: ['http', 'https', 'mailto'],

		// Enforce target="_blank" with rel="noopener noreferrer" on external links
		transformTags: {
			a: (_tagName: string, attribs: sanitizeHtml.Attributes) => {
				return {
					tagName: 'a',
					attribs: {
						...attribs,
						target: '_blank',
						rel: 'noopener noreferrer',
					},
				}
			},
		},

		// Allow data URIs for images (base64 encoded images)
		allowedSchemesByTag: {
			img: ['http', 'https', 'data'],
		},

		// Remove empty paragraphs and normalize whitespace
		exclusiveFilter: (frame: sanitizeHtml.IFrame) => {
			// Remove empty elements
			return frame.tag === 'p' && !frame.text.trim()
		},
	})
}

/**
 * Strips all HTML tags and returns plain text
 * Useful for character counting or AI processing
 */
export function stripHTML(html: string): string {
	return sanitizeHtml(html, {
		allowedTags: [],
		allowedAttributes: {},
	})
}

/**
 * Calculates actual character count from HTML content
 * Ignores HTML tags, only counts visible text
 */
export function getCharacterCount(html: string): number {
	const plainText = stripHTML(html)
	return plainText.length
}
