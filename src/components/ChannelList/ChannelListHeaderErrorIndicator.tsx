import React from 'react';
import { styled } from '../../styles/styledComponents';

import type { GestureResponderEvent } from 'react-native';

import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

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
  font-size: 12px;
  font-weight: bold;
  padding: 3px;
  ${({ theme }) => theme.channelListHeaderErrorIndicator.errorText.css}
`;

export type HeaderErrorProps = {
  onPress?: (event: GestureResponderEvent) => Promise<void> | null;
};

const ChannelListHeaderErrorIndicator = ({
  onPress = () => null,
}: HeaderErrorProps) => {
  const { t } = useTranslationContext();

  return (
    <Container onPress={onPress}>
      <ErrorText testID='channel-loading-error'>
        {t('Error while loading, please reload/refresh')}
      </ErrorText>
    </Container>
  );
};

export default ChannelListHeaderErrorIndicator;
