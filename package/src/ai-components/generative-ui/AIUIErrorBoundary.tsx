import { Component, type ReactNode } from 'react';

type AIUIErrorBoundaryProps = {
  children: ReactNode;
  onError: (error: unknown) => void;
  /** Tries the children again when it changes, such as when what they show changed. */
  resetKey?: unknown;
};

type AIUIErrorBoundaryState = { hasError: boolean; resetKey: unknown };

/**
 * Keeps generated UI that throws while it renders, such as an app's component given what it
 * didn't expect, from taking what is around it down with it. It shows nothing and says so.
 */
export class AIUIErrorBoundary extends Component<AIUIErrorBoundaryProps, AIUIErrorBoundaryState> {
  state: AIUIErrorBoundaryState = { hasError: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  static getDerivedStateFromProps(
    props: AIUIErrorBoundaryProps,
    state: AIUIErrorBoundaryState,
  ): Partial<AIUIErrorBoundaryState> | null {
    return Object.is(props.resetKey, state.resetKey)
      ? null
      : { hasError: false, resetKey: props.resetKey };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
