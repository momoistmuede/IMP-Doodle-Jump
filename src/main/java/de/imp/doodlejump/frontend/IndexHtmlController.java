package de.imp.doodlejump.frontend;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves {@code index.html} with a fresh CSP nonce per request: it replaces the placeholder in
 * {@code <meta name="csp-nonce">} (read by the Emotion cache, frontend/src/ui/emotionCache.ts) and
 * is allowed in the policy header.
 */
@Controller
public class IndexHtmlController {

  static final String NONCE_PLACEHOLDER = "__CSP_NONCE__";
  private static final int NONCE_BYTES = 16;

  private final ClassPathResource index = new ClassPathResource("static/index.html");
  private final SecureRandom random = new SecureRandom();
  private volatile String template;

  @GetMapping({"/", "/index.html"})
  public ResponseEntity<String> index(HttpServletResponse response) {
    if (!index.exists()) {
      return ResponseEntity.notFound().build(); // built with -PskipFrontend
    }
    var nonce = nonce();
    // setHeader replaces the nonce-less policy set by ContentSecurityPolicyFilter.
    response.setHeader("Content-Security-Policy", ContentSecurityPolicy.of(nonce));
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noCache())
        .contentType(new MediaType(MediaType.TEXT_HTML, StandardCharsets.UTF_8))
        .body(template().replace(NONCE_PLACEHOLDER, nonce));
  }

  private String nonce() {
    var bytes = new byte[NONCE_BYTES];
    random.nextBytes(bytes);
    return Base64.getEncoder().encodeToString(bytes);
  }

  private String template() {
    var html = template;
    if (html == null) {
      try (var in = index.getInputStream()) {
        html = new String(in.readAllBytes(), StandardCharsets.UTF_8);
      } catch (IOException e) {
        throw new UncheckedIOException(e);
      }
      template = html;
    }
    return html;
  }
}
