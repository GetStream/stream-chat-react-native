/**
 * The agent couldn't answer: it said so, with what it said as `agentMessage`, or it didn't start
 * its reply in time.
 */
export class AIAgentError extends Error {
  /** What the agent said about it, if anything. */
  readonly agentMessage?: string;

  constructor(agentMessage?: string) {
    super(agentMessage || 'The agent couldn’t answer. Try again.');
    this.name = 'AIAgentError';
    this.agentMessage = agentMessage || undefined;
  }
}
