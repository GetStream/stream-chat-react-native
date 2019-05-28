import React from 'react';
import styled from '@stream-io/styled-components';
import Moment from 'moment';

const Container = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 20;
  margin-bottom: 20;
  ${({ theme }) => theme.dateSeparator.container.extra}
`;

const Line = styled.View`
  flex: 1;
  height: 0.5;
  background-color: ${({ theme }) => theme.colors.light};
  ${({ theme }) => theme.dateSeparator.line.extra}
`;

const DateText = styled.Text`
  margin-left: 5;
  margin-right: 5;
  text-align: center;
  text-transform: uppercase;
  font-size: 10;
  opacity: 0.8;
  ${({ theme }) => theme.dateSeparator.dateText.extra}
`;

const Date = styled.Text`
  font-weight: 700;
  font-size: 10;
  text-transform: uppercase;
  opacity: 0.8;
  ${({ theme }) => theme.dateSeparator.date.extra}
`;

const DateSeparator = ({ message, formatDate }) => (
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

export { DateSeparator };
