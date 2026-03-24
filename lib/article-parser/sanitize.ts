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
	const sanitized = sanitizeHtml(html, {
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
			'picture',
			'source',
			'video',
			'iframe',
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
			img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
			source: ['src', 'srcset', 'type', 'media'],
			video: [
				'src',
				'poster',
				'controls',
				'width',
				'height',
				'preload',
				'autoplay',
				'loop',
				'muted',
			],
			iframe: [
				'src',
				'width',
				'height',
				'frameborder',
				'allow',
				'allowfullscreen',
				'title',
			],
			code: ['class'], // For syntax highlighting (e.g., language-javascript)
			pre: ['class'],
			p: ['data-video-url', 'data-video-host', 'style'], // For video fallback links
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
			// Ensure iframes have safe attributes
			iframe: (_tagName: string, attribs: sanitizeHtml.Attributes) => {
				// Only allow iframes from trusted video platforms
				const src = attribs.src as string
				const allowedDomains = [
					'youtube.com',
					'youtube-nocookie.com',
					'vimeo.com',
					'dailymotion.com',
					'ted.com',
					'player.vimeo.com',
					'www.youtube.com',
				]

				const isAllowed = allowedDomains.some((domain) =>
					src?.toLowerCase().includes(domain)
				)

				if (!isAllowed && src) {
					// Convert untrusted iframe to a paragraph with URL data attributes
					try {
						const hostname = new URL(src).hostname
						return {
							tagName: 'p',
							attribs: {
								style:
									'padding: 1rem; background: var(--bg-tertiary); border: 1px solid var(--border-primary); border-radius: 0.5rem; text-align: center; margin: 1.5rem 0;',
								'data-video-url': src,
								'data-video-host': hostname,
							},
						} as sanitizeHtml.Tag
					} catch {
						// Invalid URL - skip iframe entirely
						return {
							tagName: 'p',
							attribs: {
								style: 'display: none;',
							},
						} as sanitizeHtml.Tag
					}
				}

				return {
					tagName: 'iframe',
					attribs: {
						...attribs,
						frameborder: '0',
						allow:
							'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
						allowfullscreen: 'true',
					},
				}
			},
		},

		// Allow data URIs for images (base64 encoded images)
		allowedSchemesByTag: {
			img: ['http', 'https', 'data'],
			video: ['http', 'https'],
			source: ['http', 'https'],
			iframe: ['https'], // Only HTTPS for iframes (security)
		},

		// Remove empty paragraphs and normalize whitespace
		exclusiveFilter: (frame: sanitizeHtml.IFrame) => {
			// Remove empty elements
			return frame.tag === 'p' && !frame.text.trim()
		},
	})

	// Post-process: Convert video fallback paragraphs to clickable links
	return sanitized.replace(
		/<p([^>]*data-video-url="([^"]+)"[^>]*data-video-host="([^"]+)"[^>]*)><\/p>/g,
		(_match, attrs, url, hostname) => {
			return `<p${attrs.replace(/data-video-[^=]+=["'][^"']*["']/g, '').trim()}><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: var(--link-color); text-decoration: underline; font-weight: 500;">🎥 Watch video on ${hostname}</a></p>`
		}
	)
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
