import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for merging Tailwind CSS classes.
 * Automatically installed by shadcn/ui.
 *
 * Combines two libraries:
 * - clsx: Handles conditional classes (e.g., cn("base", isActive && "active"))
 * - twMerge: Intelligently merges Tailwind classes and resolves conflicts
 *
 * Example:
 * cn("text-red-500", "text-blue-500") → "text-blue-500" (last value wins)
 * cn("px-4 py-2", className) → merges default styles with custom className prop
 *
 * Used by all shadcn components to combine default styles with user overrides.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
