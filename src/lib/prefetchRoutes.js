const prefetched = new Set();

const ROUTE_LOADERS = {
  '/library': () => import('../pages/Library'),
  '/bible': () => import('../pages/BibleStrong'),
  '/courses': () => import('../pages/Courses'),
  '/community': () => import('../pages/Community'),
  '/agent': () => import('../pages/Agent'),
  '/profile': () => import('../pages/Profile'),
  '/heritage': () => import('../pages/Heritage'),
  '/cells': () => import('../pages/Cells'),
};

export function scheduleIdleTask(task) {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => task(), { timeout: 2500 });
    return;
  }
  window.setTimeout(task, 900);
}

export function prefetchRoute(path) {
  const loader = ROUTE_LOADERS[path];
  if (!loader || prefetched.has(path)) return;
  prefetched.add(path);
  void loader();
}

export function prefetchPrimaryRoutes() {
  ['/library', '/bible', '/courses'].forEach((path) => prefetchRoute(path));
}
