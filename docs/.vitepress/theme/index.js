import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import './style.css';
import './index.css';
import './md.css';
import './sw';
import createScrollHandler from './scrollhandler';
import LevelBadge from './LevelBadge.vue';
import ReviewBadge from './ReviewBadge.vue';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () =>
        h('div', { class: 'doc-badges' }, [h(LevelBadge), h(ReviewBadge)]),
    });
  },
  enhanceApp({ router }) {
    if (!import.meta.env.SSR) {
      createScrollHandler(router);
    }
  },
};
