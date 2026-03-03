import { createDevApp } from '@backstage/dev-utils';
import { firelinkPlugin, FirelinkPage } from '../src/plugin';

createDevApp()
  .registerPlugin(firelinkPlugin)
  .addPage({
    element: <FirelinkPage />,
    title: 'Root Page',
    path: '/firelink',
  })
  .render();
