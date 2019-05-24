import React from 'react';
import styled from '@stream-io/styled-components';
import Moment from 'moment';
import { getTheme } from '../styles/theme';

const Container = styled.View`
  display: ${(props) => getTheme(props).dateSeparator.container.display};
  flex-direction: ${(props) =>
    getTheme(props).dateSeparator.container.flexDirection};
  justify-content: ${(props) =>
    getTheme(props).dateSeparator.container.justifyContent};
  align-items: ${(props) => getTheme(props).dateSeparator.container.alignItems};
  margin-top: ${(props) => getTheme(props).dateSeparator.container.marginTop};
  margin-bottom: ${(props) =>
    getTheme(props).dateSeparator.container.marginBottom};
`;

const Line = styled.View`
  flex: ${(props) => getTheme(props).dateSeparator.line.flex};
  height: ${(props) => getTheme(props).dateSeparator.line.height};
  background-color: ${(props) =>
    getTheme(props).dateSeparator.line.backgroundColor};
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
