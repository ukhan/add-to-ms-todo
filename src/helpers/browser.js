export function isFirefox() {
  const manifest = chrome.runtime.getManifest();

  return !!(
    manifest.browser_specific_settings &&
    manifest.browser_specific_settings.gecko
  );
}
