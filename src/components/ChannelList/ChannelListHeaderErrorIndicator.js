import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';

import { TranslationContext } from '../../context';

const Container = styled.TouchableOpacity`
  align-items: center;
  background-color: #fae6e8;
  justify-content: center;
  padding: 3px;
  width: 100%;
  ${({ theme }) => theme.channelListHeaderErrorIndicator.container.css}
`;

const ErrorText = styled.Text`
  color: red;
  font-size: 12;
  font-weight: bold;
  padding: 3px;
  ${({ theme }) => theme.channelListHeaderErrorIndicator.errorText.css}
`;

const ChannelListHeaderErrorIndicator = ({ onPress = () => {} }) => {
  const { t } = useContext(TranslationContext);
  return (
    <Container onPress={onPress}>
      <ErrorText testID='channel-loading-error'>
        {t('Error while loading, please reload/refresh')}
      </ErrorText>
    </Container>
  );
};

ChannelListHeaderErrorIndicator.propTypes = {
  onPress: PropTypes.func,
};

export default ChannelListHeaderErrorIndicator;
