import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    headless: false, // set to true to hide the browser window
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
});


