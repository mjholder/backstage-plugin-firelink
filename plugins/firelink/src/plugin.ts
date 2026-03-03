import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const firelinkPlugin = createPlugin({
  id: 'firelink',
  routes: {
    root: rootRouteRef,
  },
});

export const FirelinkPage = firelinkPlugin.provide(
  createRoutableExtension({
    name: 'FirelinkPage',
    component: () =>
      import('./components/FirelinkComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);

