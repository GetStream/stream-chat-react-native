import React from 'react';
import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';
import PropTypes from 'prop-types';
import { withTranslationContext } from '../context';

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

class DateSeparator extends React.PureComponent {
  static propTypes = {
    message: PropTypes.object.isRequired,
    /**
     * Formatter function for date object.
     *
     * @param date Date object of message
     * @returns string
     */
    formatDate: PropTypes.func,
  };

  static themePath = 'messageList.dateSeparator';

  render() {
    const { message, formatDate, moment } = this.props;

    return (
      <Container>
        <Line />
        <DateText>
          {formatDate ? (
            formatDate(message.date)
          ) : (
            <React.Fragment>
              <Date>{moment(message.date).calendar()}</Date>
            </React.Fragment>
          )}
        </DateText>
        <Line />
      </Container>
    );
  }
}

const DateSeparatorWithContext = withTranslationContext(themed(DateSeparator));
export { DateSeparatorWithContext as DateSeparator };
