package de.imp.doodlejump.frontend;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.server.PathContainer;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;

/**
 * Adds the {@link ContentSecurityPolicy} (without nonce) to all frontend responses; the HTML page
 * gets its nonce-based policy from {@link IndexHtmlController}. Swagger UI and the API are left alone.
 */
@Component
public class ContentSecurityPolicyFilter extends OncePerRequestFilter {

  private final String policy = ContentSecurityPolicy.of(null);
  private final List<PathPattern> patterns = FrontendConfig.FRONTEND_PATHS.stream()
      .map(PathPatternParser.defaultInstance::parse)
      .toList();

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    var path = PathContainer.parsePath(
        request.getRequestURI().substring(request.getContextPath().length()));
    if (patterns.stream().anyMatch(pattern -> pattern.matches(path))) {
      response.setHeader("Content-Security-Policy", policy);
    }
    chain.doFilter(request, response);
  }
}
