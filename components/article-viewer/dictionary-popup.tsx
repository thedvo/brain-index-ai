/**
 * Dictionary Popup Component
 *
 * USE CASE:
 * Displays dictionary definitions in a floating popup when user selects text
 * in the article viewer.
 *
 * IMPORTANT FEATURES:
 * - Show phonetic pronunciation
 * - Display multiple meanings and parts of speech
 * - Include usage examples
 * - Show synonyms when available
 * - Play pronunciation audio (if available)
 *
 * INTEGRATION:
 * Used in ArticleViewer with the useDictionaryLookup hook.
 */
'use client'

import { DictionaryDefinition } from '@/lib/dictionary/use-dictionary-lookup'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Volume2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

type DictionaryPopupProps = {
	definition: DictionaryDefinition | null
	isLoading: boolean
	error: string | null
	onClose: () => void
	position?: { x: number; y: number }
}

export function DictionaryPopup({
	definition,
	isLoading,
	error,
	onClose,
	position = { x: 0, y: 0 },
}: DictionaryPopupProps) {
	const playAudio = (audioUrl: string) => {
		const audio = new Audio(audioUrl)
		audio.play()
	}

	if (!isLoading && !definition && !error) {
		return null
	}

	return (
		<Card
			className="fixed z-50 w-96 border-slate-700/50 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-sm"
			style={{
				left: `${position.x}px`,
				top: `${position.y}px`,
				maxHeight: '400px',
			}}
		>
			<div className="mb-3 flex items-center justify-between">
				<h3 className="text-lg font-semibold text-white">Dictionary</h3>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="h-6 w-6 text-slate-400 hover:text-white"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{isLoading && (
				<div className="flex items-center justify-center py-8">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
				</div>
			)}

			{error && (
				<div className="rounded bg-red-500/10 p-3 text-sm text-red-400">
					{error}
				</div>
			)}

			{definition && (
				<ScrollArea className="max-h-80">
					<div className="space-y-4">
						{/* Word and phonetic */}
						<div>
							<div className="flex items-center gap-2">
								<h4 className="text-2xl font-bold text-white">
									{definition.word}
								</h4>
								{definition.phonetics &&
									definition.phonetics.length > 0 &&
									definition.phonetics[0].audio && (
										<Button
											variant="ghost"
											size="icon"
											onClick={() => playAudio(definition.phonetics[0].audio!)}
											className="h-7 w-7 text-slate-400 hover:text-blue-400"
										>
											<Volume2 className="h-4 w-4" />
										</Button>
									)}
							</div>
							{definition.phonetic && (
								<p className="text-sm text-slate-400">{definition.phonetic}</p>
							)}
						</div>

						{/* Meanings */}
						{definition.meanings.map((meaning, idx) => (
							<div key={idx} className="space-y-2">
								<p className="font-semibold text-emerald-400">
									{meaning.partOfSpeech}
								</p>

								<ol className="space-y-2 pl-5">
									{meaning.definitions.slice(0, 3).map((def, defIdx) => (
										<li key={defIdx} className="text-sm text-slate-300">
											<p>{def.definition}</p>
											{def.example && (
												<p className="mt-1 italic text-slate-500">
													"{def.example}"
												</p>
											)}
										</li>
									))}
								</ol>

								{meaning.definitions[0]?.synonyms &&
									meaning.definitions[0].synonyms.length > 0 && (
										<p className="text-xs text-slate-400">
											<span className="font-semibold">Synonyms:</span>{' '}
											{meaning.definitions[0].synonyms.slice(0, 5).join(', ')}
										</p>
									)}
							</div>
						))}
					</div>
				</ScrollArea>
			)}
		</Card>
	)
}
