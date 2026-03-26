import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	/* config options here */

	// Ensure server-side packages are not bundled (they need Node.js runtime)
	serverExternalPackages: ['jsdom', '@mozilla/readability', 'sanitize-html'],
}

export default nextConfig
