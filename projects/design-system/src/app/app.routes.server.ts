import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // The routed-tabs demo nested in the Tabs page's Examples tab.
  {
    path: 'tabs/examples/tab/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [{ id: '1' }, { id: '2' }, { id: '3' }];
    },
  },
  // Every other route (including all docs tab routes) is concrete, so the
  // default prerender covers the whole app — no fallback anywhere.
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
