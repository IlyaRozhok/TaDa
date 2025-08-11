// Navigation guard to prevent unwanted redirects
let navigationBlocked = false;
let blockTimeout: NodeJS.Timeout | null = null;

export function blockNavigation(duration: number = 3000) {
  console.log(`🚫 Blocking navigation for ${duration}ms`);
  navigationBlocked = true;

  if (blockTimeout) {
    clearTimeout(blockTimeout);
  }

  blockTimeout = setTimeout(() => {
    console.log("✅ Navigation unblocked");
    navigationBlocked = false;
    blockTimeout = null;
  }, duration);
}

export function isNavigationBlocked(): boolean {
  return navigationBlocked;
}

export function unblockNavigation() {
  console.log("✅ Navigation manually unblocked");
  navigationBlocked = false;
  if (blockTimeout) {
    clearTimeout(blockTimeout);
    blockTimeout = null;
  }
}

// Wrapper for router methods that respects navigation blocking
export function safeNavigate(
  router: any,
  method: "push" | "replace",
  path: string,
  options?: any
) {
  if (navigationBlocked) {
    console.log(`⛔ Navigation to ${path} blocked`);
    return;
  }

  console.log(`➡️ Safe navigation: ${method} ${path}`);
  router[method](path, options);
}
