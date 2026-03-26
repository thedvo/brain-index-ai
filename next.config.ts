import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	/* config options here */

	// Ensure server-side packages are not bundled (they need Node.js runtime)
	serverExternalPackages: ['jsdom', '@mozilla/readability', 'sanitize-html'],

	// Webpack config for better error handling
	webpack: (config, { isServer }) => {
		if (isServer) {
			// Don't attempt to bundle native Node modules for the server
			config.externals = config.externals || []
			config.externals.push({
				'utf-8-validate': 'commonjs utf-8-validate',
				bufferutil: 'commonjs bufferutil',
				canvas: 'commonjs canvas',
			})
		}
		return config
	},
}

export default nextConfig
