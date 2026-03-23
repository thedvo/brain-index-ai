/**
 * TagSelector Component
 *
 * USE CASE:
 * Manage article tags with a multi-select interface.
 * Allows users to assign existing tags or create new ones inline
 * without leaving the article context.
 *
 * IMPORTANT FEATURES:
 * - Selected tags display as color-coded badges (removable with X button)
 * - Popover interface for tag selection (keeps UI clean)
 * - Real-time search/filter of available tags
 * - Inline tag creation:
 *   * Type new tag name in search
 *   * "Create" button appears if name doesn't exist
 *   * Instantly adds to database and selects for current article
 * - Visual indicators:
 *   * Check icon for selected tags
 *   * Color dots (3px circles) show tag color
 *   * Tag badges use tag color for border and background
 * - ScrollArea for long tag lists (200px height limit)
 *
 * USER WORKFLOW:
 * 1. Click "Add Tags" button to open popover
 * 2. Search existing tags or type new tag name
 * 3. Click tags to toggle selection (check icon appears)
 * 4. If tag doesn't exist, click "Create" button
 * 5. Selected tags appear as badges above button
 * 6. Click X on badge to remove tag
 *
 * DATA MANAGEMENT:
 * - availableTags: Full list of Tag objects from database
 * - selectedTagIds: Array of IDs for currently selected tags
 * - onTagsChange: Callback with updated ID array (parent updates DB)
 * - onCreateTag: Optional callback for creating new tags
 *
 * INTEGRATION:
 * Used in article viewer and dashboard for tag management.
 * Typically connected to /api/tags endpoints for CRUD operations.
 */
'use client'

import { useState } from 'react'
import { Tag } from '@/lib/supabase/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus, Check } from 'lucide-react'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

type TagSelectorProps = {
	availableTags: Tag[]
	selectedTagIds: string[]
	onTagsChange: (tagIds: string[]) => void
	onCreateTag?: (tagName: string) => Promise<void>
}
export function TagSelector({
	availableTags,
	selectedTagIds,
	onTagsChange,
	onCreateTag,
}: TagSelectorProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [isCreating, setIsCreating] = useState(false)

	// Get full Tag objects for currently selected tag IDs
	// Used to display selected tags as badges above the button
	const selectedTags = availableTags.filter((tag) =>
		selectedTagIds.includes(tag.id)
	)

	// Filter available tags based on search query (case-insensitive)
	// Shows matching tags in the popover dropdown list
	const filteredTags = availableTags.filter((tag) =>
		tag.tag_name.toLowerCase().includes(searchQuery.toLowerCase())
	)

	// Add or remove a tag from the selection
	// If already selected, removes it; if not selected, adds it
	// Calls parent's onTagsChange with updated ID array
	const toggleTag = (tagId: string) => {
		if (selectedTagIds.includes(tagId)) {
			onTagsChange(selectedTagIds.filter((id) => id !== tagId))
		} else {
			onTagsChange([...selectedTagIds, tagId])
		}
	}

	// Remove a specific tag from selection
	// Used by the X button on selected tag badges
	const removeTag = (tagId: string) => {
		onTagsChange(selectedTagIds.filter((id) => id !== tagId))
	}

	// Create a new tag with the current search query text
	// Calls parent's onCreateTag callback to save to database
	// Clears search input on success, shows loading state during creation
	const handleCreateTag = async () => {
		if (!onCreateTag || !searchQuery.trim()) return

		setIsCreating(true)
		try {
			await onCreateTag(searchQuery.trim())
			setSearchQuery('')
		} finally {
			setIsCreating(false)
		}
	}

	return (
		<div className="space-y-3">
			{/* Selected Tags */}
			{selectedTags.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedTags.map((tag) => (
						<Badge
							key={tag.id}
							variant="outline"
							className="text-sm bg-slate-800/50 border-slate-600 text-slate-300 pr-1"
							style={{
								borderColor: tag.color + '50',
								backgroundColor: tag.color + '15',
							}}
						>
							<span style={{ color: tag.color }}>{tag.tag_name}</span>
							<button
								onClick={() => removeTag(tag.id)}
								className="ml-2 hover:bg-slate-700 rounded-sm p-0.5 transition-colors"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			)}

			{/* Add Tag Button */}
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
					>
						<Plus className="h-4 w-4 mr-2" />
						{selectedTags.length > 0 ? 'Manage Tags' : 'Add Tags'}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-80 p-0 bg-slate-900 border-slate-700"
					align="start"
				>
					<div className="p-3 space-y-3">
						{/* Search/Create Input */}
						<div className="relative">
							<Input
								type="text"
								placeholder="Search or create tags..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="bg-slate-800 border-slate-700 text-slate-100"
							/>
							{onCreateTag &&
								searchQuery.trim() &&
								!filteredTags.some(
									(t) => t.tag_name.toLowerCase() === searchQuery.toLowerCase()
								) && (
									<Button
										size="sm"
										onClick={handleCreateTag}
										disabled={isCreating}
										className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs"
									>
										<Plus className="h-3 w-3 mr-1" />
										Create
									</Button>
								)}
						</div>

						{/* Tag List */}
						<ScrollArea className="h-[200px]">
							<div className="space-y-1">
								{filteredTags.length === 0 ? (
									<div className="text-center py-8 text-sm text-slate-400">
										{searchQuery ? 'No tags found' : 'No tags yet'}
									</div>
								) : (
									filteredTags.map((tag) => {
										const isSelected = selectedTagIds.includes(tag.id)
										return (
											<button
												key={tag.id}
												onClick={() => toggleTag(tag.id)}
												className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-800 transition-colors text-left"
											>
												<div className="flex items-center gap-2">
													<div
														className="w-3 h-3 rounded-full"
														style={{ backgroundColor: tag.color }}
													/>
													<span className="text-sm text-slate-200">
														{tag.tag_name}
													</span>
												</div>
												{isSelected && (
													<Check className="h-4 w-4 text-green-400" />
												)}
											</button>
										)
									})
								)}
							</div>
						</ScrollArea>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
}
