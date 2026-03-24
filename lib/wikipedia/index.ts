/**
 * Wikipedia Integration Module
 *
 * Exports all Wikipedia-related utilities for enriching articles
 * with contextual links and information.
 */

export {
	searchWikipedia,
	getWikipediaArticle,
	batchSearchWikipedia,
	type WikipediaSearchResult,
} from './search'

export {
	generateWikipediaUrl,
	enrichTermsWithWikipedia,
	validateWikipediaUrl,
	extractWikipediaUrls,
	type EnrichedTerm,
} from './link-generator'
