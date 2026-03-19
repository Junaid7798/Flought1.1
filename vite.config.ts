import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$lib: resolve('./src/lib'),
		},
	},
	build: {
		rollupOptions: {
			output: {
				// Split CodeMirror into its own cacheable chunk.
				// CM6 is only loaded when a thought route is visited (lazy by route).
				// This separate chunk means it can be cached independently across deployments.
				manualChunks(id) {
					if (id.includes('@codemirror') || id.includes('@lezer')) {
						return 'codemirror';
					}
				},
			},
		},
	},
	test: {
		environment: 'jsdom',
		globals: true,
		include: ['src/**/*.test.ts'],
		alias: {
			$lib: resolve('./src/lib'),
		},
	},
});
