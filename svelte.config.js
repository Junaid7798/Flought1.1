import adapter from '@sveltejs/adapter-static';
import { visualizer } from 'rollup-plugin-visualizer';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html'
		})
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

// Enable bundle analysis in production builds when BUNDLE_ANALYZE env var is set
if (process.env.BUNDLE_ANALYZE) {
	config.kit.vite = {
		plugins: [visualizer({ filename: 'bundle-analysis.html', open: false })]
	};
}

export default config;

