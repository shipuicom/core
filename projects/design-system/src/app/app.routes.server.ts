import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'tabs/tab/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [{ id: '1' }, { id: '2' }, { id: '3' }];
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
