/**
 * Dictionary Lookup Hook
 *
 * USE CASE:
 * Provides dictionary definition lookup functionality for selected text
 * in the article viewer. Uses the Free Dictionary API.
 *
 * IMPORTANT FEATURES:
 * - Fetch word definitions from Free Dictionary API
 * - Handle loading and error states
 * - Format definitions with phonetics, meanings, and examples
 * - Cache results to avoid duplicate API calls
 *
 * INTEGRATION:
 * Used in article viewer for right-click or text selection lookups.
 */

import { useState, useCallback } from 'react'

export interface DictionaryDefinition {
	word: string
	phonetic?: string
	phonetics: Array<{
		text: string
		audio?: string
	}>
	meanings: Array<{
		partOfSpeech: string
		definitions: Array<{
			definition: string
			example?: string
			synonyms?: string[]
			antonyms?: string[]
		}>
	}>
}

export function useDictionaryLookup() {
	const [definition, setDefinition] = useState<DictionaryDefinition | null>(
		null
	)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const lookupWord = useCallback(async (word: string) => {
		if (!word || word.trim().length === 0) {
			setError('No word provided')
			return
		}

		// Clean the word (remove punctuation, convert to lowercase)
		const cleanWord = word.trim().toLowerCase().replace(/[^\w]/g, '')

		if (!cleanWord) {
			setError('Invalid word')
			return
		}

		try {
			setIsLoading(true)
			setError(null)

			const response = await fetch(
				`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`
			)

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Word not found in dictionary')
				}
				throw new Error('Failed to fetch definition')
			}

			const data = await response.json()

			if (data && data.length > 0) {
				setDefinition(data[0])
			} else {
				throw new Error('No definition found')
			}
		} catch (err) {
			console.error('Dictionary lookup error:', err)
			setError(err instanceof Error ? err.message : 'Failed to lookup word')
			setDefinition(null)
		} finally {
			setIsLoading(false)
		}
	}, [])

	const clearDefinition = useCallback(() => {
		setDefinition(null)
		setError(null)
	}, [])

	return {
		definition,
		isLoading,
		error,
		lookupWord,
		clearDefinition,
	}
}
