<template>
  <div v-if="level" class="level-badge-wrapper">
    <span :class="`vp-badge ${badgeType}`">{{ badgeLabel }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useData } from 'vitepress';

const { frontmatter } = useData();

const level = computed(() => {
  if (frontmatter.value.overview) return null;
  return frontmatter.value.level ?? null;
});

const badgeType = computed(() => {
  const map = { entry: 'tip', mid: 'warning', senior: 'danger', '???': 'info' };
  return map[level.value] ?? 'info';
});

const badgeLabel = computed(() => {
  const map = { entry: 'Entry Level', mid: 'Mid Level', senior: 'Senior Level', '???': 'Needs Review' };
  return map[level.value] ?? level.value;
});
</script>
