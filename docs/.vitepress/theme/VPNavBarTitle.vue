<template>
  <div class="fee-nav-container" v-if="hasSidebar">
    <div>
      <div class="fee-nav-hero">
        FEE
      </div>
      <span class="nav-sub">Frontend Engineering Essentials</span>
    </div>
  </div>
</template>

<script setup>
import { useSidebar } from 'vitepress/theme';
const { hasSidebar } = useSidebar();
</script>

<style>
.fee-nav-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 15px 0;
}
.fee-nav-hero {
  font-size: 20px;
  background: -webkit-linear-gradient(left, #2980b9, white, #3498db);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
}
span.nav-sub {
  padding: 10px;
}
</style>
