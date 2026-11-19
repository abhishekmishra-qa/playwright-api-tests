// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  // The practice API runs on a free host shared by many people, so it can be slow.
  timeout: 60_000,

  // Every test makes its own data, so they can run in parallel.
  // A few workers are enough and keep the load on a free public API polite.
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,

  // One retry on CI for network hiccups. Locally a failure should show up right away.
  retries: process.env.CI ? 1 : 0,

  // Fail the CI run if a test.only was left in the code by mistake.
  forbidOnly: !!process.env.CI,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL || 'https://restful-booker.herokuapp.com',
    // Without this header the API answers "418 I'm a Teapot" instead of JSON.
    extraHTTPHeaders: { Accept: 'application/json' },
  },
});
