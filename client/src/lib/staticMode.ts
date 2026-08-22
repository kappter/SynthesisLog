/**
 * Build-time flag for the isolated GitHub Pages proof of concept.
 * Static mode deliberately leaves the production server architecture untouched.
 */
export const isStaticMode = () => import.meta.env.VITE_STATIC_MODE === "true";

/** Vite supplies a trailing slash, including `/SynthesisLog/` in the static build. */
export const appBasePath = () => import.meta.env.BASE_URL;
