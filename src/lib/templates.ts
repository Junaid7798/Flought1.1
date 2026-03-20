export interface TemplateDefinition {
	id: string;
	name: string;
	icon: string; // Lucide icon name or emoji
	markdown: string;
}

export const TEMPLATES: TemplateDefinition[] = [
	{
		id: 'daily-os',
		name: 'Daily Operating System',
		icon: 'Sun',
		markdown: `# Daily OS: {{date}}

## 🎯 Top 3 Intentions
1. [ ] 
2. [ ] 
3. [ ] 

## 📝 Rapid Capture
- 

## 🔋 Energy Tracker
- [ ] Morning Workout
- [ ] Deep Work Block 1
- [ ] Evening Reflection

## 🧠 Daily Reflection
- One thing I learned today:
- One thing I could have done better:
`
	},
	{
		id: 'project-kanban',
		name: 'Project & Task Kanban',
		icon: 'Trello',
		markdown: `# Project: [Project Name]

| Task | Status | Priority | Due Date |
|------|--------|----------|----------|
| Setup repo | [Status: Done] | [Priority: High] | 2026-03-20 |
| Design UI | [Status: In Progress] | [Priority: Med] | 2026-03-25 |
| API Integration | [Status: Inbox] | [Priority: High] | 2026-04-01 |

## 🚀 Vision
Brief description of the project goal.

## 📌 References
- [[Reference 1]]
`
	},
	{
		id: 'habit-tracker',
		name: 'Weekly Habit Tracker',
		icon: 'CheckCircle2',
		markdown: `# Weekly Habits: Week {{week}}

| Habit | M | T | W | T | F | S | S | % |
|-------|---|---|---|---|---|---|---|---|
| Meditate | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | 0% |
| Read 20m | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | 0% |
| No Sugar | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | 0% |

<ProgressBar value="0%">
`
	},
	{
		id: 'meeting-notes',
		name: 'Meeting Notes',
		icon: 'Users',
		markdown: `# Meeting: [Subject]\n**Date:** {{date}}\n**Attendees:** \n\n## 📋 Agenda\n- \n\n## 📓 Notes\n- \n\n## ✅ Action Items\n- [ ] @person task...\n`
	},
	{
		id: 'personal-dashboard',
		name: 'Personal Dashboard',
		icon: 'LayoutDashboard',
		markdown: `# 🌌 Personal Dashboard
> "Habit is the nursery of errors but also the engine of progress."

## 📌 Quick Capture
- 

## 🎯 Active Objectives
| Goal | Priority | Status | Target Date |
|------|----------|--------|-------------|
| Launch V2 | High | 🟢 On Track | 2026-Q1 |
| Marathon Training | Medium | 🟡 At Risk | 2026-May |
| Read 24 Books | Low | 🟢 On Track | 2026-Dec |

## 📆 Weekly Priorities
- [ ] Finalize marketing materials
- [ ] Review PRs for graph interactions
- [ ] Hit 30 miles running volume
`
	},
	{
		id: 'project-portal',
		name: 'Project Portal',
		icon: 'Rocket',
		markdown: `# 🚀 Project Portal

## 📖 Overview
Brief summary of the project, the "why", and the ultimate outcome.

## 🔗 Key Resources
- [Figma Design](https://figma.com/)
- [API Documentation](https://api.example.com/)
- [[Product Requirements Document]]

## ⚡ Next Actions
- [ ] Draft initial component structure
- [ ] Setup database schema
- [ ] Configure CI/CD pipeline

## 📈 Timeline
| Phase | Goal | ETA |
|-------|------|-----|
| Discovery | Align on scope | Completed |
| Build | Core features complete | Nov 15 |
| Beta | Internal testing | Dec 01 |
| Launch | Public release | Dec 15 |
`
	}
];
