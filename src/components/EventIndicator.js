import React from 'react';
import styled from '@stream-io/styled-components';
import { Avatar } from './Avatar';
import PropTypes from 'prop-types';
import { withTranslationContext } from '../context';

const Date = styled.Text`
  font-size: 10;
  color: rgba(0, 0, 0, 0.5);
  ${({ theme }) => theme.messageList.eventIndicator.date.css}
`;

const MemberUpdateContainer = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 10px;
  ${({ theme }) => theme.messageList.eventIndicator.memberUpdateContainer.css}
`;

const MemberUpdateTextContainer = styled.View`
  display: flex;
  flex-direction: column;
  margin-left: 10px;
  ${({ theme }) =>
    theme.messageList.eventIndicator.memberUpdateTextContainer.css}
`;

const MemberUpdateText = styled.Text`
  font-size: 13px;
  font-style: italic;
  color: rgba(0, 0, 0, 0.5);
  ${({ theme }) => theme.messageList.eventIndicator.memberUpdateText.css}
`;

/**
 * A component to display a message regarding channel notifications such as
 * 'member.added', 'member.removed' etc.
 */
const EventIndicator = ({ event, t, tDateTimeParser }) => {
  if (event.type === 'member.added' || event.type === 'member.removed') {
    return (
      <MemberUpdateContainer>
        <Avatar name={event.user.name} image={event.user.image} />
        <MemberUpdateTextContainer>
          <MemberUpdateText>
            {event.type === 'member.added'
              ? t('{{ username }} joined the chat', {
                  username: event.user.name,
                })
              : t('{{ username }} was removed from the chat', {
                  username: event.user.name,
                })}
          </MemberUpdateText>
          <Date>{tDateTimeParser(event.received_at).format('LT')}</Date>
        </MemberUpdateTextContainer>
      </MemberUpdateContainer>
    );
  }

  return null;
};

EventIndicator.propTypes = {
  event: PropTypes.object,
};

const EventIndicatorWithContext = withTranslationContext(EventIndicator);
export { EventIndicatorWithContext as EventIndicator };
