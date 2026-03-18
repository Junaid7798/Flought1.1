// Phase 2 will expand each blueprint with full seed content.
// This stub defines the canonical shape that applyBlueprint() depends on.

export interface Blueprint {
	label: string;
	category: 'work' | 'personal';
	pipelineLabels: [string, string, string, string];
	seedThoughts: Array<{ title: string; meta_state: 1 | 2 | 3 | 4; topic: string }>;
	topicFolders: string[];
	kineticHookInstruction: string;
}

export const BLUEPRINTS: Record<string, Blueprint> = {
	freelance: {
		label: 'Freelance',
		category: 'work',
		pipelineLabels: ['Leads', 'Scoping', 'Active', 'Delivered'],
		seedThoughts: [
			{ title: 'New client enquiry', meta_state: 1, topic: 'Business' },
			{ title: 'Draft project proposal', meta_state: 2, topic: 'Business' },
			{ title: 'Current project milestones', meta_state: 3, topic: 'Projects' },
		],
		topicFolders: ['Business', 'Projects', 'Clients', 'Finance'],
		kineticHookInstruction: 'Add your first client or project lead',
	},
	research: {
		label: 'Research',
		category: 'work',
		pipelineLabels: ['Collected', 'Reading', 'Synthesising', 'Published'],
		seedThoughts: [
			{ title: 'Interesting paper to read', meta_state: 1, topic: 'Sources' },
			{ title: 'Research question', meta_state: 2, topic: 'Questions' },
			{ title: 'Emerging hypothesis', meta_state: 3, topic: 'Ideas' },
		],
		topicFolders: ['Sources', 'Questions', 'Ideas', 'Outputs'],
		kineticHookInstruction: 'Capture your first research question',
	},
	writing: {
		label: 'Writing',
		category: 'work',
		pipelineLabels: ['Ideas', 'Drafting', 'Editing', 'Published'],
		seedThoughts: [
			{ title: 'Story idea', meta_state: 1, topic: 'Ideas' },
			{ title: 'Article outline', meta_state: 2, topic: 'Drafts' },
			{ title: 'Chapter in progress', meta_state: 3, topic: 'Drafts' },
		],
		topicFolders: ['Ideas', 'Drafts', 'Characters', 'Research'],
		kineticHookInstruction: 'Capture your first idea or story seed',
	},
	'job-hunt': {
		label: 'Job Hunt',
		category: 'work',
		pipelineLabels: ['Spotted', 'Applied', 'Interviewing', 'Closed'],
		seedThoughts: [
			{ title: 'Interesting company', meta_state: 1, topic: 'Companies' },
			{ title: 'Application submitted', meta_state: 2, topic: 'Applications' },
			{ title: 'Interview prep notes', meta_state: 3, topic: 'Prep' },
		],
		topicFolders: ['Companies', 'Applications', 'Prep', 'Contacts'],
		kineticHookInstruction: 'Add the first role or company you are targeting',
	},
	startup: {
		label: 'Startup',
		category: 'work',
		pipelineLabels: ['Ideas', 'Validating', 'Building', 'Launched'],
		seedThoughts: [
			{ title: 'Problem to solve', meta_state: 1, topic: 'Strategy' },
			{ title: 'Customer interview insight', meta_state: 2, topic: 'Research' },
			{ title: 'MVP feature in progress', meta_state: 3, topic: 'Product' },
		],
		topicFolders: ['Strategy', 'Research', 'Product', 'Growth'],
		kineticHookInstruction: 'Capture the core problem you are solving',
	},
	journaling: {
		label: 'Journaling',
		category: 'personal',
		pipelineLabels: ['Captured', 'Reflecting', 'Processing', 'Resolved'],
		seedThoughts: [
			{ title: 'Something on my mind', meta_state: 1, topic: 'Daily' },
			{ title: 'Pattern I noticed', meta_state: 2, topic: 'Reflection' },
			{ title: 'Goal I am working through', meta_state: 3, topic: 'Growth' },
		],
		topicFolders: ['Daily', 'Reflection', 'Growth', 'Gratitude'],
		kineticHookInstruction: 'Write down the first thing on your mind',
	},
	engineering: {
		label: 'Engineering',
		category: 'work',
		pipelineLabels: ['Backlog', 'In Design', 'In Progress', 'Shipped'],
		seedThoughts: [
			{ title: 'Bug to investigate', meta_state: 1, topic: 'Bugs' },
			{ title: 'Feature design notes', meta_state: 2, topic: 'Design' },
			{ title: 'PR in review', meta_state: 3, topic: 'Work' },
		],
		topicFolders: ['Bugs', 'Design', 'Work', 'Learning'],
		kineticHookInstruction: 'Add the first task or bug you are tracking',
	},
	content: {
		label: 'Content Creator',
		category: 'work',
		pipelineLabels: ['Ideas', 'Scripting', 'Producing', 'Published'],
		seedThoughts: [
			{ title: 'Video concept', meta_state: 1, topic: 'Ideas' },
			{ title: 'Script draft', meta_state: 2, topic: 'Scripts' },
			{ title: 'Post in production', meta_state: 3, topic: 'Production' },
		],
		topicFolders: ['Ideas', 'Scripts', 'Production', 'Analytics'],
		kineticHookInstruction: 'Capture your first content idea',
	},
	marketing: {
		label: 'Marketing',
		category: 'work',
		pipelineLabels: ['Ideas', 'Planning', 'Live', 'Reviewed'],
		seedThoughts: [
			{ title: 'Campaign concept', meta_state: 1, topic: 'Campaigns' },
			{ title: 'Copy draft', meta_state: 2, topic: 'Copy' },
			{ title: 'Active experiment', meta_state: 3, topic: 'Experiments' },
		],
		topicFolders: ['Campaigns', 'Copy', 'Experiments', 'Insights'],
		kineticHookInstruction: 'Add your first campaign idea or insight',
	},
	pkm: {
		label: 'Personal Knowledge',
		category: 'personal',
		pipelineLabels: ['Inbox', 'Processing', 'Connected', 'Evergreen'],
		seedThoughts: [
			{ title: 'Interesting idea', meta_state: 1, topic: 'Fleeting' },
			{ title: 'Concept to develop', meta_state: 2, topic: 'Literature' },
			{ title: 'Note worth keeping', meta_state: 3, topic: 'Permanent' },
		],
		topicFolders: ['Fleeting', 'Literature', 'Permanent', 'Projects'],
		kineticHookInstruction: 'Capture the first idea you want to keep',
	},
};
