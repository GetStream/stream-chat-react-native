import React from 'react';
import styled from '@stream-io/styled-components';
import { withTranslationContext } from '../../context';
import PropTypes from 'prop-types';

const Container = styled.TouchableOpacity`
  width: 100%;
  align-items: center;
  justify-content: center;
  background-color: #fae6e8;
  padding: 3px;
  ${({ theme }) => theme.channelListHeaderErrorIndicator.container.css}
`;

const ErrorText = styled.Text`
  color: red;
  font-size: 12;
  font-weight: bold;
  padding: 3px;
  ${({ theme }) => theme.channelListHeaderErrorIndicator.errorText.css}
`;

const ChannelListHeaderErrorIndicator = withTranslationContext(
  ({ onPress, t }) => (
    <Container
      onPress={() => {
        onPress && onPress();
      }}
    >
      <ErrorText>{t('Error while loading, please reload/refresh')}</ErrorText>
    </Container>
  ),
);

ChannelListHeaderErrorIndicator.propTypes = {
  onPress: PropTypes.func,
};

export default ChannelListHeaderErrorIndicator;
