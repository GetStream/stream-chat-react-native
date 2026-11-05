import type { ComponentType } from 'react';

import type { ComponentNode } from '@a2ui/web_core';

/**
 * What a view of one of the basic catalog's components gets: what the agent wrote for it, with
 * its bindings and functions worked out. A property the person can change, such as a TextField's
 * `value`, comes with a setter named after it (`setValue`). A child is a node, drawn with
 * `A2UIChild`, and children are a list of them.
 */
export type A2UIComponentProps = {
  /** The component where the agent placed it, for its id and its place in the data model. */
  node: ComponentNode;
  props: Record<string, unknown>;
};

/** Views of the basic catalog's components by their A2UI type, such as `Card`. */
export type A2UIComponents = Partial<Record<string, ComponentType<A2UIComponentProps>>>;
