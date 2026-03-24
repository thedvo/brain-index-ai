/**
 * Theme Context for Reading Modes
 *
 * Provides light, dark, and sepia themes optimized for long-form reading.
 * Colors chosen for optimal contrast and reduced eye strain.
 */
'use client'

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react'

export type Theme = 'light' | 'dark' | 'sepia'

interface ThemeContextType {
	theme: Theme
	setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>('dark')

	// Load theme from localStorage on mount
	useEffect(() => {
		const saved = localStorage.getItem('reader-theme') as Theme
		if (saved && ['light', 'dark', 'sepia'].includes(saved)) {
			setTheme(saved)
		}
	}, [])

	// Save theme to localStorage when it changes
	useEffect(() => {
		localStorage.setItem('reader-theme', theme)
		document.documentElement.setAttribute('data-theme', theme)
	}, [theme])

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (!context) {
		throw new Error('useTheme must be used within ThemeProvider')
	}
	return context
}
