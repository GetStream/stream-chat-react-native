import React from 'react';
import styled from '@stream-io/styled-components';
import Moment from 'moment';
import { themed } from '../styles/theme';

const Container = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 20;
  margin-bottom: 20;
  ${({ theme }) => theme.messageList.dateSeparator.container.css}
`;

const Line = styled.View`
  flex: 1;
  height: 0.5;
  background-color: ${({ theme }) => theme.colors.light};
  ${({ theme }) => theme.messageList.dateSeparator.line.css}
`;

const DateText = styled.Text`
  margin-left: 5;
  margin-right: 5;
  text-align: center;
  text-transform: uppercase;
  font-size: 10;
  opacity: 0.8;
  ${({ theme }) => theme.messageList.dateSeparator.dateText.css}
`;

const Date = styled.Text`
  font-weight: 700;
  font-size: 10;
  text-transform: uppercase;
  opacity: 0.8;
  ${({ theme }) => theme.messageList.dateSeparator.date.css}
`;

/**
 * @extends PureComponent
 * @example ./docs/DateSeparator.md
 */
const DateSeparatorComp = ({ message, formatDate }) => (
  <Container>
    <Line />
    <DateText>
      {formatDate ? (
        formatDate(message.date)
      ) : (
        <React.Fragment>
          <Date>{Moment(message.date).format('dddd')}</Date> at{' '}
          {Moment(message.date).format('hh:mm A')}
        </React.Fragment>
      )}
    </DateText>
    <Line />
  </Container>
);

DateSeparatorComp.themePath = 'messageList.dateSeparator';

export const DateSeparator = themed(DateSeparatorComp);
