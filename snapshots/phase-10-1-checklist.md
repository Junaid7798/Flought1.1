# Phase 10.1 — Native Mobile APIs — Sign-off Checklist
Date: 2026-03-19

## Task 10.1 — Native Mobile APIs

### Packages installed
- [x] @capacitor/haptics@8.0.1
- [x] @capacitor/share@8.0.1
- [x] @capacitor/keyboard@8.0.1
- [x] @capgo/capacitor-navigation-bar@8.0.25 (official @capacitor/navigation-bar does not exist)

### ThoughtEditor / thought page — Export (Share) button
- [x] Share imported from @capacitor/share in thought/[id]/+page.svelte
- [x] Capacitor imported for isNativePlatform() guard
- [x] handleShare() calls Share.share({ title, text, dialogTitle })
- [x] Share2 icon shown in mobile-header only when Capacitor.isNativePlatform()
- [x] .share-btn: 44×44px tap target, margin-left: auto (right-aligned)

### MobileDock — keyboard hide/show
- [x] Keyboard imported from @capacitor/keyboard
- [x] onMount: Keyboard.addListener('keyboardWillShow') → dockHidden = true (native only)
- [x] onMount: Keyboard.addListener('keyboardWillHide') → dockHidden = false (native only)
- [x] onDestroy: Keyboard.removeAllListeners() (native only)
- [x] class:dock-hidden={dockHidden} on nav element
- [x] .dock-hidden: transform: translateY(100%) + opacity: 0 (Rule 9 compliant)

### (app)/+layout.svelte — Android nav bar colour
- [x] NavigationBar imported from @capgo/capacitor-navigation-bar
- [x] Capacitor.getPlatform() === 'android' guard in onMount
- [x] getComputedStyle(document.body).getPropertyValue('--bg-deep') resolves hex
- [x] NavigationBar.setNavigationBarColor({ color, darkButtons: false })

### Haptics on stage changes
- [x] FrontmatterMask.svelte: Haptics.impact({ style: ImpactStyle.Light }) before updateThought
- [x] NodeContextMenu.svelte: Haptics.impact({ style: ImpactStyle.Light }) before updateThought
- [x] Both guarded with Capacitor.isNativePlatform()

## Verification gates
- [x] npm run check: 0 errors, 0 warnings (4120 files)
- [x] npm test: 42/42 passing
- [x] Flought reviewer blocks 1-9: all PASS
