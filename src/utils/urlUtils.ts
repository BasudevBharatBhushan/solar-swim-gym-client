/**
 * Normalizes a public URL returned by the backend to use the current window's origin.
 * This ensures that links work correctly across different environments (local, staging, production).
 */
export const normalizePublicUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  
  try {
    // If it's already a relative URL, prepend current origin
    if (url.startsWith('/')) {
      return window.location.origin + url;
    }

    // List of known public routes that should point to this same frontend application
    const knownPublicRoutes = [
      '/public/sign-waiver',
      '/public/pay/',
      '/activate',
      '/admin/activate'
    ];

    const hasKnownRoute = knownPublicRoutes.some(route => url.includes(route));

    if (hasKnownRoute) {
      const urlObj = new URL(url);
      // Construct a new URL using current window's origin but keeping path and search params
      return window.location.origin + urlObj.pathname + urlObj.search;
    }
  } catch (e) {
    console.warn("Could not normalize public URL:", url, e);
  }

  return url || '';
};
