import React from 'react';
import styled from '@stream-io/styled-components';
import Moment from 'moment';

const Container = styled.View`
  display: ${({ theme }) => theme.dateSeparator.container.display};
  flex-direction: ${({ theme }) => theme.dateSeparator.container.flexDirection};
  justify-content: ${({ theme }) =>
    theme.dateSeparator.container.justifyContent};
  align-items: ${({ theme }) => theme.dateSeparator.container.alignItems};
  margin-top: ${({ theme }) => theme.dateSeparator.container.marginTop};
  margin-bottom: ${({ theme }) => theme.dateSeparator.container.marginBottom};
`;

const Line = styled.View`
  flex: ${({ theme }) => theme.dateSeparator.line.flex};
  height: ${({ theme }) => theme.dateSeparator.line.height};
  background-color: ${({ theme }) => theme.dateSeparator.line.backgroundColor};
`;

const DateText = styled.Text`
  margin-left: ${({ theme }) => theme.dateSeparator.date.marginLeft};
  margin-right: ${({ theme }) => theme.dateSeparator.date.marginRight};
  text-align: ${({ theme }) => theme.dateSeparator.date.textAlign};
  text-transform: ${({ theme }) => theme.dateSeparator.date.textTransform};
  font-size: ${({ theme }) => theme.dateSeparator.date.fontSize};
  opacity: ${({ theme }) => theme.dateSeparator.date.opacity};
`;

const Strong = styled.Text`
  font-weight: 700;
  font-size: ${({ theme }) => theme.dateSeparator.date.fontSize};
  text-transform: ${({ theme }) => theme.dateSeparator.date.textTransform};
  opacity: ${({ theme }) => theme.dateSeparator.date.opacity};
`;

const DateSeparator = ({ message, formatDate }) => (
  <Container>
    <Line />
    <DateText>
      {formatDate ? (
        formatDate(message.date)
      ) : (
        <React.Fragment>
          <Strong>{Moment(message.date).format('dddd')}</Strong> at{' '}
          {Moment(message.date).format('hh:mm A')}
        </React.Fragment>
      )}
    </DateText>
    <Line />
  </Container>
);

export { DateSeparator };
