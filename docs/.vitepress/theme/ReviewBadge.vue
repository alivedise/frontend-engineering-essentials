<template>
  <span v-if="phase" :class="['VPBadge', badgeType, 'review-badge']" :title="tooltip">
    {{ label }}<span v-if="dateLabel" class="review-date">· {{ dateLabel }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { useData } from 'vitepress';

const { frontmatter } = useData();

const phase = computed(() => {
  if (frontmatter.value.overview) return null;
  return frontmatter.value.reviewed ?? null;
});

const badgeType = computed(() => (phase.value === 'hardened' ? 'tip' : 'info'));

const label = computed(() =>
  phase.value === 'hardened' ? 'Hardened'
  : phase.value === 'tone' ? 'Tone-Polished'
  : phase.value);

// reviewed_on is YYYY-MM-DD; show YYYY-MM
const dateLabel = computed(() => {
  const d = frontmatter.value.reviewed_on;
  return d ? String(d).slice(0, 7) : null;
});

const tooltip = computed(() =>
  phase.value === 'hardened'
    ? 'Fact-checked against primary sources, tone and structure revised, both languages synced.'
    : 'Tone pass: AI-writing patterns removed with meaning preserved.');
</script>

<style scoped>
.review-badge { margin-left: 0; }
.review-date { margin-left: 4px; opacity: 0.75; font-variant-numeric: tabular-nums; }
</style>
