/**
 * ArticleInputBar Component
 *
 * USE CASE:
 * Primary input mechanism for adding new articles to the system.
 * Provides a ChatGPT-style input experience where users paste article URLs.
 *
 * IMPORTANT FEATURES:
 * - URL validation before submission (ensures valid URL format)
 * - Loading state management (prevents double-submission)
 * - Enter key submission (press Enter to submit)
 * - Auto-clear on success (input resets after successful submission)
 * - Visual feedback with loading spinner on send button
 * - Ref forwarding (allows external focus control)
 *
 * INTEGRATION:
 * Typically placed at the top of the dashboard, connected to the
 * /api/articles/parse endpoint for article parsing and saving.
 *
 * PROPS:
 * - onSubmit: Async callback that handles URL processing
 * - placeholder: Custom input placeholder text
 * - disabled: External disable state (e.g., during batch operations)
 */
'use client'

import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

type ArticleInputBarProps = {
	onSubmit: (url: string) => Promise<void>
	placeholder?: string
	disabled?: boolean
}

export interface ArticleInputBarHandle {
	focus: () => void
}

export const ArticleInputBar = forwardRef<ArticleInputBarHandle, ArticleInputBarProps>(
	function ArticleInputBar({ onSubmit, placeholder = 'Paste article URL here...', disabled = false }, ref) {
	const [url, setUrl] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	// Expose focus method to parent
	useImperativeHandle(ref, () => ({
		focus: () => {
			inputRef.current?.focus()
		}
	}))

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!url.trim() || isLoading || disabled) return

		// Basic URL validation
		try {
			new URL(url.trim())
		} catch {
			toast.error('Invalid URL', {
				description: 'Please enter a valid web address (e.g., https://example.com)',
			})
			return
		}

		setIsLoading(true)
		try {
			await onSubmit(url.trim())
			setUrl('') // Clear input on success
		} catch (error) {
			toast.error('Failed to save article', {
				description: error instanceof Error ? error.message : 'Please try again',
			})
		} finally {
			setIsLoading(false)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSubmit(e)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="w-full">
			<div className="relative flex items-center gap-2">
				<Input
					ref={inputRef}
					type="text"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					disabled={disabled || isLoading}
					className="h-12 pr-12 text-base bg-slate-900/50 border-slate-700 focus:border-blue-500 transition-colors"
				/>
				<Button
					type="submit"
					disabled={!url.trim() || disabled || isLoading}
					size="icon"
					className="absolute right-2 h-8 w-8"
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Send className="h-4 w-4" />
					)}
				</Button>
			</div>
		</form>
	)
})
