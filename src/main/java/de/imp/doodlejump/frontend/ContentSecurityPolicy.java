package de.imp.doodlejump.frontend;

/**
 * CSP for the frontend: everything only from the service itself. MUI/Emotion injects
 * {@code <style>} elements, which are only allowed with the per-request nonce of {@code index.html};
 * some MUI components set inline {@code style} attributes, hence {@code style-src-attr 'unsafe-inline'}.
 */
public final class ContentSecurityPolicy {

  private ContentSecurityPolicy() {
  }

  /**
   * @param nonce nonce for Emotion's {@code <style>} elements, or {@code null} for responses that
   * are not an HTML page
   */
  public static String of(String nonce) {
    var styleNonce = nonce != null ? " 'nonce-" + nonce + "'" : "";
    return String.join("; ",
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'" + styleNonce,
        "style-src-elem 'self'" + styleNonce,
        "style-src-attr 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'");
  }
}
