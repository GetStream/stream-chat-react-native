import React from 'react';
import styled from 'styled-components';
import Moment from 'moment';

const Container = styled.View`
  display: ${(props) => props.theme.dateSeparator.container.display};
  flex-direction: ${(props) =>
    props.theme.dateSeparator.container.flexDirection};
  justify-content: ${(props) =>
    props.theme.dateSeparator.container.justifyContent};
  align-items: ${(props) => props.theme.dateSeparator.container.alignItems};
`;

const Line = styled.View`
  flex: ${(props) => props.theme.dateSeparator.line.flex};
  border-color: ${(props) => props.theme.dateSeparator.line.borderColor};
  border-width: ${(props) => props.theme.dateSeparator.line.borderWidth};
  height: ${(props) => props.theme.dateSeparator.line.height};
`;

const DateText = styled.Text``;

const DateSeparator = ({ message, formatDate, date }) => (
  <Container collapsable={false}>
    <Line />
    <DateText>
      {formatDate
        ? formatDate(date)
        : Moment(message.date.toISOString()).calendar(null, {
            lastDay: '[Yesterday]',
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            lastWeek: '[Last] dddd',
            nextWeek: 'dddd',
            sameElse: 'L',
          })}
    </DateText>
    <Line />
  </Container>
);

export { DateSeparator };
