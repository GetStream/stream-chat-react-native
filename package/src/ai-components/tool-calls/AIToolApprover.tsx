import React, { createContext, type PropsWithChildren, useContext } from 'react';

import type { AIToolCallPart } from '../message-parts/types';

/**
 * How the person signs in on this device when a tool call waits for their account at a
 * provider, and how their "not now" reaches your backend, which holds the call until one or
 * the other.
 */
export type AIToolAuthorizer = {
  /**
   * Opens the call's sign-in. Resolves `true` once the account is connected: your backend then
   * updates the call's step, and until it does the sign-in reads as connecting. Resolves `false`
   * when the person closed the sign-in or it ended without connecting, so they can try again.
   * Rejects when the sign-in could not be opened.
   */
  connect: (call: AIToolCallPart) => Promise<boolean>;
  /**
   * Tells your backend the person won't sign in now. Your backend ends the call, which never
   * runs. A rejection lets the person answer again.
   */
  decline: (call: AIToolCallPart) => Promise<void>;
};

/**
 * The person answering tool calls' questions on this device, and how their answer reaches
 * your backend, which holds each call until it gets one.
 */
export type AIToolApprover = {
  /** This install, matched against a client tool call's `target_client_id`. */
  clientId: string;
  /**
   * Sends the answer. Your backend checks it is this person's (and this install's, for a
   * client tool), then updates the call's step; until then the question stays, with its
   * buttons disabled. A rejection lets the person answer again.
   */
  decide: (call: AIToolCallPart, allowed: boolean) => Promise<void>;
  /** The person signed in, matched against a call's `target_user_id`. */
  userId: string;
  /** How this person signs in when a call waits for their account. Without one, no sign-in is offered here. */
  authorizer?: AIToolAuthorizer;
};

const AIToolApproverContext = createContext<AIToolApprover | undefined>(undefined);

/** Provides the approver to the AI components below it, for those not given one as a prop. */
export const AIToolApproverProvider = ({
  approver,
  children,
}: PropsWithChildren<{ approver?: AIToolApprover }>) => (
  <AIToolApproverContext.Provider value={approver}>{children}</AIToolApproverContext.Provider>
);

/** The approver given as a prop, else the one of the nearest `AIToolApproverProvider`. */
export const useAIToolApprover = (approver?: AIToolApprover) => {
  const fromContext = useContext(AIToolApproverContext);
  return approver ?? fromContext;
};
