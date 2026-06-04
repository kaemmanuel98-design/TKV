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
  '/podcasts': () => import('../pages/Podcasts'),
  '/confessional': () => import('../pages/Confessional'),
  '/friends': () => import('../pages/Friends'),
  '/map': () => import('../pages/MapPage'),
  '/about': () => import('../pages/About'),
};

export function scheduleIdleTask(task) {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => task(), { timeout: 1200 });
    return;
  }
  window.setTimeout(task, 400);
}

export function prefetchRoute(path) {
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';

  if (normalized.startsWith('/book/')) {
    if (prefetched.has('/book')) return;
    prefetched.add('/book');
    void import('../pages/BookReader');
    return;
  }

  const loader = ROUTE_LOADERS[normalized];
  if (!loader || prefetched.has(normalized)) return;
  prefetched.add(normalized);
  void loader();
}

export function prefetchPrimaryRoutes() {
  ['/library', '/bible', '/courses'].forEach((path) => prefetchRoute(path));
}

export function prefetchAllNavRoutes() {
  Object.keys(ROUTE_LOADERS).forEach((path) => prefetchRoute(path));
}
