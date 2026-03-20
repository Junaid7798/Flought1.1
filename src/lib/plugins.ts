export interface PluginDefinition {
	id: string;
	name: string;
	description: string;
	category: 'V1' | 'V2' | 'V3';
	is_available: boolean;
	icon?: string; // Lucide icon name or emoji
}

export const PLUGINS: PluginDefinition[] = [
	{
		id: 'thermal-calendar',
		name: 'Thermal Calendar',
		description: 'Visual density map of your thought activity over the last 28 days.',
		category: 'V1',
		is_available: true,
		icon: 'Calendar'
	},
	{
		id: 'momentum-tracker',
		name: 'Momentum Tracker',
		description: 'Track your flow state and velocity across the pipeline stages.',
		category: 'V1',
		is_available: true,
		icon: 'Zap'
	},
	{
		id: 'serendipity-collider',
		name: 'Serendipity Collider',
		description: 'Surface random intersections between your library and current context.',
		category: 'V1',
		is_available: true,
		icon: 'Orbit'
	},
	{
		id: 'table-macros',
		name: 'Table Macros',
		description: 'Notion-style interactive tables with status pills and checkboxes.',
		category: 'V1',
		is_available: true,
		icon: 'Table'
	},
	{
		id: 'floating-toolbar',
		name: 'Floating Toolbar',
		description: 'Context-aware formatting and color tools that follow your cursor.',
		category: 'V1',
		is_available: true,
		icon: 'Type'
	},
	{
		id: 'canvas-hulls',
		name: 'Canvas Hulls',
		description: 'Organic visual grouping of thoughts by their pipeline stage on the graph.',
		category: 'V1',
		is_available: true,
		icon: 'Zap'
	},
	{
		id: 'mycelial-routing',
		name: 'Mycelial Routing',
		description: 'AI-driven discovery of organic pathways between distant thoughts.',
		category: 'V2',
		is_available: false,
		icon: 'Share2'
	},
	{
		id: 'semantic-auto-linking',
		name: 'Semantic Auto-Linking',
		description: 'Automatically surface connections based on conceptual similarity.',
		category: 'V2',
		is_available: false,
		icon: 'Link'
	},
	{
		id: 'ai-rewriter',
		name: 'AI Contextual Excerpts',
		description: 'Generate smart summaries and link previews using local LLMs.',
		category: 'V3',
		is_available: false,
		icon: 'Sparkles'
	}
];
