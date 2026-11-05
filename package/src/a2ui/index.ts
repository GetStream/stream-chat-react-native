// The A2UI renderer for the AI components' generated UI. Its own entry point, so an app whose
// agent never writes A2UI doesn't bundle the A2UI core.
export {
  A2UI_DEFAULT_CATALOG_ID,
  type A2UIError,
  type A2UIRendererOptions,
  createA2UIRenderer,
} from './A2UIRenderer';
export { A2UI_VERSION } from './A2UIStream';
export { A2UIChild, A2UIChildren } from './A2UISurface';
export { A2UI_BASIC_COMPONENTS } from './components/basicComponents';
export type { A2UIComponentProps, A2UIComponents } from './components/types';
