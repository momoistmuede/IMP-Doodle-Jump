package de.imp.doodlejump.frontend;

import java.time.Duration;
import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves the static files of the frontend built from {@code frontend/} (packaged into
 * {@code classpath:/static}, see build.gradle). {@code index.html} is served by
 * {@link IndexHtmlController}.
 */
@Configuration
public class FrontendConfig implements WebMvcConfigurer {

  /** Paths of the frontend, which get the Content-Security-Policy. */
  public static final List<String> FRONTEND_PATHS = List.of("/", "/index.html", "/assets/**", "/icon.png", "/imp-logo.png");

  private static final String STATIC = "classpath:/static/";

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // File names under /assets carry a content hash.
    registry.addResourceHandler("/assets/**")
        .addResourceLocations(STATIC + "assets/")
        .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
  }
}
