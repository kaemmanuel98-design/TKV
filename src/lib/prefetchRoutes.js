const prefetched = new Set();

function prefetchRouteI18n(path) {
  void import('../i18n/loadI18nLayers').then((m) => {
    if (path === '/heritage') void m.loadHeritageI18n();
    if (path === '/courses') void m.loadCourseI18n();
  });
}

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
    window.requestIdleCallback(() => task(), { timeout: 800 });
    return;
  }
  window.setTimeout(task, 200);
}

export function prefetchRoute(path) {
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';

  if (normalized === '/heritage' || normalized === '/courses') {
    prefetchRouteI18n(normalized);
  }

  if (normalized.startsWith('/heritage/')) {
    prefetchRouteI18n('/heritage');
    if (prefetched.has('/heritage-detail')) return;
    prefetched.add('/heritage-detail');
    void import('../components/HeritageDetailLayout');
    if (normalized.includes('/article/')) void import('../pages/HeritageArticle');
    if (normalized.includes('/event/')) void import('../pages/HeritageEvent');
    if (normalized.includes('/character/')) void import('../pages/HeritageCharacter');
    return;
  }

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
