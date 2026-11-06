/**
 * Lighthouse CI config for the PR gate's `lighthouse` job: the sample app's signed-in home page,
 * measured on a desktop profile. Run from the repo root; ported from PR #553.
 *
 * The job collects one run at a time (`lhci collect --additive --numberOfRuns=1`, 10 times), so
 * each run gets a fresh browser, a fresh sign-in and a cold HTTP cache: a true first load.
 * lighthouse-report.mjs then averages the runs into the PR comment.
 *
 *   LH_RUNS        runs when collecting in one go (default 10; the job loops instead)
 *   LH_COLD_CACHE  false to keep the HTTP cache between sign-in and measuring (default true)
 */
module.exports = {
  ci: {
    collect: {
      // LHCI serves the built app itself; the Angular router handles every path.
      staticDistDir: 'dist/sample-app/browser',
      isSinglePageApplication: true,
      numberOfRuns: Number(process.env.LH_RUNS) || 10,
      // Sign in first, so Lighthouse scores the home page and not the login page. Relative to the
      // repo root: LHCI joins it onto the working directory, so an absolute path breaks.
      puppeteerScript: 'scripts/ci/lighthouse/lighthouse-auth.cjs',
      // With a puppeteerScript, LHCI starts Chrome through Puppeteer, so flags go here
      // (settings.chromeFlags is ignored in this mode).
      puppeteerLaunchOptions: {
        args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
      settings: {
        // The desktop profile varies less from run to run on shared CI machines.
        preset: 'desktop',
        // CometChat keeps its session in IndexedDB. Lighthouse must not clear storage, or the
        // sign-in would be gone before the measured load; lighthouse-auth.cjs clears only the
        // HTTP cache.
        disableStorageReset: true,
      },
    },
    upload: {
      // Reports stay on the runner and are uploaded as the job's artifact.
      target: 'filesystem',
      outputDir: '.lighthouseci',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%',
    },
  },
};
