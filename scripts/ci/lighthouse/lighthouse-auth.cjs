/**
 * Lighthouse CI sign-in script (`collect.puppeteerScript` in lighthouserc.cjs), ported from
 * PR #553. Before each run it signs in to the sample app as E2E_USER_UID and waits for the home
 * page, so Lighthouse measures the signed-in app.
 *
 * Keys come only from the environment (the PR gate's `e2e` environment). The sample app is built
 * with them (scripts/ci/write-environment.mjs), so the credentials page normally never shows; if
 * it does, it is filled from E2E_APP_ID / E2E_AUTH_KEY / E2E_REGION. Nothing is hard-coded.
 *
 * It waits for elements, never for "network idle": the chat keeps a WebSocket open, so the
 * network never goes idle.
 */

const UID = process.env.LH_USER_UID || process.env.E2E_USER_UID;
const APP_ID = process.env.E2E_APP_ID;
const AUTH_KEY = process.env.E2E_AUTH_KEY;
const REGION = process.env.E2E_REGION || 'us';

// The home page counts as reached once the conversations list renders.
const HOME = '.cometchat-conversations, cometchat-conversations, .cometchat-home';

// Default on: after signing in, empty the HTTP cache this script warmed, so Lighthouse measures a
// first load. The session (IndexedDB) stays, so the home page still opens signed in.
const COLD_CACHE = (process.env.LH_COLD_CACHE || 'true').toLowerCase() !== 'false';

async function clearHttpCache(page) {
  try {
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    await client.send('Network.clearBrowserCache');
    await client.detach();
  } catch {
    // Best effort: a warm run is still a valid measurement.
  }
}

module.exports = async (browser, context) => {
  if (!UID) throw new Error('lighthouse-auth: set E2E_USER_UID (or LH_USER_UID) to the user to sign in as');
  const page = await browser.newPage();
  try {
    await page.goto(context.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForSelector(`.cometchat-login__container, .cometchat-credentials__form, ${HOME}`, { timeout: 45_000 });
    if (await page.$(HOME)) return; // still signed in from an earlier run

    if (await page.$('.cometchat-credentials__form')) {
      if (!APP_ID || !AUTH_KEY) throw new Error('lighthouse-auth: the app asks for credentials; set E2E_APP_ID and E2E_AUTH_KEY');
      await page.type('#appId', APP_ID);
      await page.type('#authKey', AUTH_KEY);
      await page.evaluate((region) => {
        const options = Array.from(document.querySelectorAll('.cometchat-credentials__region'));
        const match = options.find((el) => (el.textContent || '').toUpperCase().includes(region.toUpperCase()));
        (match || options[0])?.click();
      }, REGION);
      await page.click('.cometchat-credentials__button');
      await page.waitForSelector('.cometchat-login__container', { timeout: 30_000 });
    }

    await page.waitForSelector('#customUid', { timeout: 30_000 });
    await page.type('#customUid', UID);
    await page.click('.cometchat-login__submit-button');
    await Promise.race([
      page.waitForSelector(HOME, { timeout: 90_000 }),
      page.waitForSelector('.cometchat-login__error, [role="alert"]', { timeout: 90_000 }).then(async (el) => {
        const text = el ? await page.evaluate((node) => node.textContent, el) : '';
        throw new Error(`lighthouse-auth: sign-in failed: ${(text || '').trim()}`);
      }),
    ]);
  } finally {
    // On every path, so each run starts with a cold cache, not just the first.
    if (COLD_CACHE) await clearHttpCache(page);
    await page.close();
  }
};
