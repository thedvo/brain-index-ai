/**
 * UserNotesInput Component
 *
 * USE CASE:
 * Personal note-taking textarea for articles with automatic saving.
 * Provides a seamless writing experience where notes are saved
 * automatically without manual save button clicks.
 *
 * IMPORTANT FEATURES:
 * - Auto-save with 1-second debounce:
 *   * Waits for user to stop typing (1000ms of inactivity)
 *   * Prevents excessive API calls during typing
 *   * Only saves if notes have actually changed
 * - Visual save status indicators:
 *   * Idle: No indicator (waiting for changes)
 *   * Saving: Blue spinner + "Saving..." text
 *   * Saved: Green check + "Saved" text (shows 2 seconds)
 *   * Error: Red "Failed to save" text (shows 3 seconds)
 * - Optimistic UI updates (textarea updates immediately)
 * - Cleanup on unmount (clears pending timeout)
 *
 * IMPLEMENTATION DETAILS:
 * - useRef for timeout management (prevents re-render on timeout changes)
 * - lastSavedRef tracks last saved state (prevents duplicate saves)
 * - useEffect with cleanup handles auto-save lifecycle
 * - Timeout is cleared and reset on every keystroke
 *
 * USER EXPERIENCE:
 * User types naturally without thinking about saving.
 * Status indicator provides confidence that work is being saved.
 * No interruption from save dialogs or manual save steps.
 *
 * INTEGRATION:
 * Used in article viewer for personal notes.
 * Connected to /api/articles/notes endpoint for updates.
 * initialNotes populated from article.user_notes field.
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Check } from 'lucide-react'

type UserNotesInputProps = {
	initialNotes?: string
	onSave: (notes: string) => Promise<void>
	placeholder?: string
	label?: string
	autoSaveDelay?: number // milliseconds
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function UserNotesInput({
	initialNotes = '',
	onSave,
	placeholder = 'Add your notes here...',
	label = 'Personal Notes',
	autoSaveDelay = 1000, // Waits for user to stop typing (1000ms of inactivity)
}: UserNotesInputProps) {
	const [notes, setNotes] = useState(initialNotes)
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
	const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
	const lastSavedRef = useRef(initialNotes)

	// Auto-save effect
	useEffect(() => {
		// Clear any existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}

		// Don't save if notes haven't changed
		if (notes === lastSavedRef.current) {
			return
		}

		// Set status to idle (waiting for user to stop typing)
		setSaveStatus('idle')

		// Set new timeout for auto-save
		timeoutRef.current = setTimeout(async () => {
			setSaveStatus('saving')
			try {
				await onSave(notes)
				lastSavedRef.current = notes
				setSaveStatus('saved')

				// Reset to idle after showing success
				setTimeout(() => {
					setSaveStatus('idle')
				}, 2000)
			} catch (error) {
				console.error('Failed to save notes:', error)
				setSaveStatus('error')

				// Reset to idle after showing error
				setTimeout(() => {
					setSaveStatus('idle')
				}, 3000)
			}
		}, autoSaveDelay)

		// Cleanup timeout on unmount or when notes change
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [notes, onSave, autoSaveDelay])

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setNotes(e.target.value)
	}

	const getSaveStatusIndicator = () => {
		switch (saveStatus) {
			case 'saving':
				return (
					<div className="flex items-center gap-2 text-xs text-blue-400">
						<Loader2 className="h-3 w-3 animate-spin" />
						Saving...
					</div>
				)
			case 'saved':
				return (
					<div className="flex items-center gap-2 text-xs text-green-400">
						<Check className="h-3 w-3" />
						Saved
					</div>
				)
			case 'error':
				return (
					<div className="flex items-center gap-2 text-xs text-red-400">
						Failed to save
					</div>
				)
			default:
				return null
		}
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label
					htmlFor="user-notes"
					className="text-sm font-medium text-slate-300"
				>
					{label}
				</Label>
				{getSaveStatusIndicator()}
			</div>
			<Textarea
				id="user-notes"
				value={notes}
				onChange={handleChange}
				placeholder={placeholder}
				className="min-h-[120px] bg-slate-900/50 border-slate-700 focus:border-blue-500 text-slate-100 resize-y"
				rows={6}
			/>
			<p className="text-xs text-slate-500">Notes auto-save as you type</p>
		</div>
	)
}
