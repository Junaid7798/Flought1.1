<script lang="ts">
	import { $t as t } from '$lib/i18n';
	// Phase 4 will render the Canvas 2D graph here.
</script>

<div class="map-placeholder">
	<p class="hint">{t('map.placeholder')}</p>
</div>

<style>
	.map-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted);
	}

	.hint {
		font-size: 0.875rem;
	}
</style>
