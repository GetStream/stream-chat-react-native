/**
 * What an `AIAgentError` says when the agent said nothing of its own, a translation key: show it
 * with `t(error.message)`.
 */
export const AI_AGENT_ERROR_MESSAGE = "The agent couldn't answer. Try again.";

/**
 * The agent couldn't answer: it said so, with what it said as `agentMessage`, or it didn't start
 * its reply in time.
 */
export class AIAgentError extends Error {
  /** What the agent said about it, if anything. */
  readonly agentMessage?: string;

  constructor(agentMessage?: string) {
    super(agentMessage || AI_AGENT_ERROR_MESSAGE);
    this.name = 'AIAgentError';
    this.agentMessage = agentMessage || undefined;
  }
}
