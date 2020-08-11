import React, { useContext } from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { themed } from '../../styles/theme';
import { TranslationContext } from '../../context';

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
 * @example ../docs/DateSeparator.md
 */
const DateSeparator = (props) => {
  const { message, formatDate } = props;
  const { tDateTimeParser } = useContext(TranslationContext);

  return (
    <Container testID={'date-separator'}>
      <Line />
      <DateText>
        {formatDate ? (
          formatDate(message.date)
        ) : (
          <React.Fragment>
            <Date>{tDateTimeParser(message.date).calendar()}</Date>
          </React.Fragment>
        )}
      </DateText>
      <Line />
    </Container>
  );
};

DateSeparator.themePath = 'messageList.dateSeparator';

DateSeparator.propTypes = {
  message: PropTypes.object.isRequired,
  /**
   * Formatter function for date object.
   *
   * @param date Date object of message
   * @returns string
   */
  formatDate: PropTypes.func,
};

export default themed(DateSeparator);
