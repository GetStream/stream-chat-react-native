import React, {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { type AccessibilityProps, View as RNView, type ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  type ComponentApi,
  type ComponentNode,
  effect,
  getValue,
  isComponentNode,
  isWritable,
  NodeResolver,
  peekValue,
  ResolvedBinding,
  type Signal,
  type SurfaceModel,
} from '@a2ui/web_core';

import { A2UIEngineContext, A2UIReplyContext } from './A2UIContexts';
import { keepSecretPath } from './secrets';

import { AIUIComponentView } from '../ai-components/generative-ui/AIUIComponent';
import { useAIUIComesIn, useAIUIEntrance } from '../ai-components/generative-ui/AIUIEntrance';
import { isRecord } from '../ai-components/generative-ui/AIUIHelpers';

/** The value of an A2UI signal, following it. */
export const useSignalValue = <T,>(signal: Signal<T>) => {
  const subscribe = useCallback(
    (onChange: () => void) =>
      effect(() => {
        getValue(signal);
        onChange();
      }),
    [signal],
  );
  const getSnapshot = useCallback(() => peekValue(signal), [signal]);
  return useSyncExternalStore(subscribe, getSnapshot);
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const viewValueOf = (value: unknown): unknown => {
  if (isComponentNode(value)) return value;
  if (value instanceof ResolvedBinding) return viewValueOf(value.value);
  if (Array.isArray(value)) return value.map(viewValueOf);
  if (isPlainObject(value)) return viewPropsOf(value);
  return value;
};

const noop = () => undefined;

// What a component's view reads: bindings as their values, with a setter for each one the person
// can change, named after it, such as `setValue` for `value`. Children stay nodes.
const viewPropsOf = (props: Record<string, unknown>) => {
  const view: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value instanceof ResolvedBinding) {
      view[key] = viewValueOf(value.value);
      view[`set${key.charAt(0).toUpperCase()}${key.slice(1)}`] = isWritable(value)
        ? value.set
        : noop;
    } else view[key] = viewValueOf(value);
  }
  return view;
};

/** The axis the parent of a part lays its children out on, which a part's weight grows along. */
export const A2UIAxisContext = createContext<'column' | 'row'>('column');

const said = (value: unknown) =>
  value === undefined || value === null || value === '' ? undefined : String(value);

// What the agent tells assistive technology about a part, with its `accessibility`: what to call
// it, what more to say about it, whether to announce its changes, and whether to leave it out.
const accessibilityOf = (accessibility: unknown): AccessibilityProps => {
  if (!isRecord(accessibility)) return {};
  const { description, hidden, label, live } = accessibility;
  const named = said(label);
  const described = said(description);
  return {
    ...(named ? { accessibilityLabel: named } : {}),
    ...(described ? { accessibilityHint: described } : {}),
    ...(live === 'polite' || live === 'assertive' ? { accessibilityLiveRegion: live } : {}),
    ...(hidden === true
      ? { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' }
      : {}),
  };
};

// One of the app's components where the agent placed it, with the arguments it declares.
const PlacedComponent = ({
  node,
  props,
}: {
  node: ComponentNode;
  props: Record<string, unknown>;
}) => {
  const engine = useContext(A2UIEngineContext);
  const reply = useContext(A2UIReplyContext);
  const component = engine?.appComponent(node.type);
  const names = component?.definition.parameters.map(({ name }) => name);
  const args = useMemo(
    () =>
      Object.fromEntries(
        (names ?? []).filter((name) => name in props).map((name) => [name, props[name]]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the names change with the component
    [component, props],
  );
  if (!engine || !reply || !component) return null;
  const { messageId } = reply;
  const { name } = component.definition;
  return (
    <AIUIComponentView
      args={args}
      component={component}
      context={{
        emit: (event, label, payload = {}) =>
          void engine.host.send({
            format: 'a2ui',
            label,
            messageId,
            name: event,
            payload: { ...payload, component: name },
          }),
        host: engine.host,
        isStreaming: reply.isStreaming,
        messageId,
      }}
    />
  );
};

/**
 * One part of a surface: its view from the basic catalog, or the app's component of its type,
 * coming in when it shows, with its weight and what the agent tells assistive technology. A part
 * whose type no catalog has, or that is still on its way, shows nothing.
 */
// The path of the data model a TextField writes what the person types to, when it is obscured,
// such as a password, which must never reach the agent.
const secretPathOf = (node: ComponentNode, resolved: Record<string, unknown>) => {
  if (node.type !== 'TextField') return undefined;
  const variant =
    resolved.variant instanceof ResolvedBinding ? resolved.variant.value : resolved.variant;
  const { value } = resolved;
  return variant === 'obscured' && value instanceof ResolvedBinding && isWritable(value)
    ? value.path
    : undefined;
};

const A2UINode = memo(({ node }: { node: ComponentNode }) => {
  const engine = useContext(A2UIEngineContext);
  const axis = useContext(A2UIAxisContext);
  const resolved = useSignalValue(node.props) as Record<string, unknown>;
  const props = useMemo(() => viewPropsOf(resolved), [resolved]);
  // Before the person can type: whichever view draws the field, what they type stays theirs.
  const secretPath = secretPathOf(node, resolved);
  const surface = node.context?.dataContext.surface;
  useLayoutEffect(() => {
    if (secretPath && surface) keepSecretPath(surface, secretPath);
  }, [secretPath, surface]);
  const comesIn = useAIUIComesIn();
  if (!engine || node.isPlaceholder || node.state !== 'resolved') return null;
  const View = engine.components[node.type];
  const isApp = !View && !!engine.appComponent(node.type);
  if (!View && !isApp) return null;
  // A weighted part shares the room its row leaves, as flex-grow from nothing does.
  const weight = typeof props.weight === 'number' && axis === 'row' ? props.weight : undefined;
  const Part = comesIn ? EnteringPart : ShownPart;
  return (
    <Part
      {...accessibilityOf(props.accessibility)}
      style={weight !== undefined ? { flexBasis: 0, flexGrow: weight } : undefined}
      testID={`a2ui-${node.componentId}`}
    >
      {View ? <View node={node} props={props} /> : <PlacedComponent node={node} props={props} />}
    </Part>
  );
});
A2UINode.displayName = 'A2UINode';

type PartProps = ViewProps & { children: ReactNode };

// A part that comes in as it shows, such as while the agent writes it.
const EnteringPart = ({ children, style, ...props }: PartProps) => {
  const { scope, style: entrance } = useAIUIEntrance();
  return (
    <Animated.View {...props} style={[entrance, style]}>
      {scope(children)}
    </Animated.View>
  );
};

// A part that shows at once, such as one of a reply from history: a plain view, since nothing of
// it moves and a list that scrolls fast mounts it all the time.
const ShownPart = ({ children, ...props }: PartProps) => <RNView {...props}>{children}</RNView>;

/** A child of a part, as its view gets it: a node, or nothing while it is on its way. */
export const A2UIChild = ({ node }: { node: unknown }) =>
  isComponentNode(node) ? <A2UINode node={node} /> : null;

/** The children of a part, as its view gets them. */
export const A2UIChildren = ({ nodes }: { nodes: unknown }) => (
  <>
    {Array.isArray(nodes)
      ? nodes.map((node) =>
          isComponentNode(node) ? <A2UINode key={node.instanceId} node={node} /> : null,
        )
      : null}
  </>
);

const resolvers = new WeakMap<SurfaceModel<ComponentApi>, NodeResolver<ComponentApi>>();

const resolverOf = (surface: SurfaceModel<ComponentApi>) => {
  let resolver = resolvers.get(surface);
  if (!resolver) {
    resolver = new NodeResolver<ComponentApi>(surface, surface.defaultCatalog);
    resolvers.set(surface, resolver);
  }
  return resolver;
};

/** A surface of a reply: its tree of parts, from its root, as the agent writes them. */
export const A2UISurfaceView = ({ surface }: { surface: SurfaceModel<ComponentApi> }) => {
  const root = useSignalValue(resolverOf(surface).rootNode);
  return root ? <A2UINode node={root} /> : null;
};
