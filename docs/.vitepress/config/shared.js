import { fileURLToPath, URL } from 'node:url';

export const shared = {
  transformPageData(pageData) {
    pageData.frontmatter.head ??= [];
    if (pageData.frontmatter.id != null) {
      pageData.title = `FEE-${pageData.frontmatter.id}: ${pageData.frontmatter.title}`;
    } else if (pageData.frontmatter.title != null) {
      pageData.title = `${pageData.frontmatter.title}`;
    }
    pageData.frontmatter.head.push([
      'meta',
      {
        name: 'og:title',
        content: pageData.frontmatter.id != null
          ? `FEE-${pageData.frontmatter.id}: ${pageData.frontmatter.title}`
          : pageData.frontmatter.title || 'Frontend Engineering Essentials',
      },
    ]);
  },
  cleanUrls: true,
  base: '/frontend-engineering-essentials/',
  lastUpdated: true,
  themeConfig: {
    logo: 'favicon.svg',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/alivedise/frontend-engineering-essentials' },
    ],
    search: {
      provider: 'local',
    },
  },
  vite: {
    resolve: {
      alias: [
        {
          find: /^.*\/VPNavBarTitle\.vue$/,
          replacement: fileURLToPath(
            new URL('../theme/VPNavBarTitle.vue', import.meta.url)
          ),
        },
      ],
    },
    optimizeDeps: {
      include: ['mermaid'],
    },
    ssr: {
      noExternal: ['mermaid'],
    },
  },
  head: [
    ['link', { rel: 'icon', href: 'favicon.svg' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700' }],
  ],
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    },
    manifest: {
      name: 'Frontend Engineering Essentials',
      short_name: 'FEE',
      description: 'Frontend Engineering Essentials documentation',
      theme_color: '#3498db',
      icons: [
        {
          src: 'favicon.svg',
          sizes: '192x192',
          type: 'image/svg+xml',
        },
      ],
    },
  },
  ignoreDeadLinks: true,
  mermaid: {},
  mermaidPlugin: {
    class: 'mermaid my-class',
  },
};
