// What apps and renderers of their own use. The helpers these are made with stay inside the
// package, so changing them is no change to its API.
export {
  type AIUIAction,
  type AIUIActionJSON,
  AI_UI_ACTION_CUSTOM_DATA_KEY,
  AI_UI_ACTION_MAX_BYTES,
  aiUIActionJSON,
  aiUIActionProblem,
} from './AIUIAction';
export { decodeAIUIArguments } from './AIUIArguments';
export {
  type AIUIComponent,
  type AIUIComponentContext,
  type AIUIComponentProps,
  AIUIComponentView,
  defineAIUIComponent,
} from './AIUIComponent';
export {
  type AIUIComponentDefinition,
  type AIUIComponentEvent,
  type AIUIJSONSchema,
  type AIUIParameter,
  AIUIParameterType,
  aiUIComponentDefinitionJSON,
  optionalAIUIParameter,
  parseAIUIComponentDefinition,
  requiredAIUIParameter,
} from './AIUIComponentDefinition';
export {
  type AIUIDocument,
  type AIUIDocumentJSON,
  type AIUIFormat,
  AI_UI_CUSTOM_DATA_KEY,
  AI_UI_SUPPORTED_VERSION,
  aiUIDocumentText,
  parseAIUIDocument,
} from './AIUIDocument';
export { AIUICascade, AIUIEntrance, AIUIEntranceStage, useAIUIEntrance } from './AIUIEntrance';
export {
  AIUIHost,
  type AIUIHostOptions,
  AIUIToolError,
  aiUIClientToolJSON,
  isWebOrEmailLink,
} from './AIUIHost';
export {
  aiUIMediaSource,
  type AIUIMediaURL,
  aiUIPublicMediaURL,
  isPublicWebURL,
} from './AIUIMedia';
export type { AIUIEngine, AIUIRenderer } from './AIUIRenderer';
export { AIUIView, type AIUIViewProps, useAIUIHostRefresh } from './AIUIView';
