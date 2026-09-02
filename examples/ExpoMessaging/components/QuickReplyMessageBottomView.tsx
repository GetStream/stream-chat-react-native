import React, { useEffect, useState } from 'react';

import { useMessageContext } from 'stream-chat-expo';

import QuickReplyPills from './QuickReplyPills';

// Minimal CIT-1311 repro harness: mimics Robin's `quick_replies` field
// attaching to an already-rendered, already-measured message some time
// after it first appears. Hardcoded trigger + replies for now — send a
// message containing "1311" and watch the scroll position once the pills
// mount ~1.5s later.
const TRIGGER_KEYWORD = '1311';
const REPLY_DELAY_MS = 1500;
const HARDCODED_REPLIES = ['Yes', 'No'];

export const QuickReplyMessageBottomView = () => {
  const { message } = useMessageContext();
  const [showPills, setShowPills] = useState(false);
  const messageId = message.id;
  const messageText = message.text;

  useEffect(() => {
    if (!messageText?.includes(TRIGGER_KEYWORD)) {
      return;
    }
    const timeoutId = setTimeout(() => setShowPills(true), REPLY_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [messageId, messageText]);

  if (!showPills) {
    return null;
  }

  return <QuickReplyPills replies={HARDCODED_REPLIES} />;
};
