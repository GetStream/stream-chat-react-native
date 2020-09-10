import React, { useContext } from 'react';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';

import { TranslationContext } from '../../context';
import { themed } from '../../styles/theme';

const Container = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-vertical: 20px;
  ${({ theme }) => theme.messageList.dateSeparator.container.css}
`;

const Line = styled.View`
  flex: 1;
  height: 0.5px;
  background-color: ${({ theme }) => theme.colors.light};
  ${({ theme }) => theme.messageList.dateSeparator.line.css}
`;

const DateText = styled.Text`
  margin-horizontal: 5px;
  text-align: center;
  text-transform: uppercase;
  font-size: 10px;
  opacity: 0.8;
  ${({ theme }) => theme.messageList.dateSeparator.dateText.css}
`;

const Date = styled.Text`
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.8;
  ${({ theme }) => theme.messageList.dateSeparator.date.css}
`;

/**
 * @example ../docs/DateSeparator.md
 */
const DateSeparator = (props) => {
  const { formatDate, message } = props;
  const { tDateTimeParser } = useContext(TranslationContext);

  return (
    <Container testID='date-separator'>
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
  /**
   * Formatter function for date object.
   *
   * @param date Date object of message
   * @returns string
   */
  formatDate: PropTypes.func,
  message: PropTypes.object.isRequired,
};

export default themed(DateSeparator);
