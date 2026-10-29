// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://tullabiya.kfupm.edu.sa',
  output: 'static',
  trailingSlash: 'always',
  integrations: [preact()],
  i18n: {
    defaultLocale: 'ar',
    locales: ['ar', 'en'],
    routing: {
      prefixDefaultLocale: true,
      // src/pages/index.astro owns the root redirect so it can honor the saved language.
      redirectToDefaultLocale: false,
    },
  },
  devToolbar: { enabled: false },
});
