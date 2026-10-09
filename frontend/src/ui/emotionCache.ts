import createCache from '@emotion/cache';

/**
 * Emotion writes MUI's styles into `<style>` tags. The Content-Security-Policy only allows them
 * with the per-request nonce that the service puts into `<meta name="csp-nonce">`
 * (see IndexHtmlController.java). In `npm run dev` the placeholder is left as is and no CSP applies.
 */
export function createEmotionCache() {
  const nonce = document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content;
  return createCache({
    key: 'mui',
    nonce: nonce && !nonce.startsWith('__') ? nonce : undefined,
    prepend: true,
  });
}
