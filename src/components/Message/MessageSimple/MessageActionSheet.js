import React, { useContext } from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';

import { TranslationContext } from '../../../context';

const ActionSheetButtonContainer = styled.View`
  align-items: center;
  background-color: #fff;
  height: 50px;
  justify-content: center;
  width: 100%;
  ${({ theme }) => theme.message.actionSheet.buttonContainer.css};
`;

const ActionSheetButtonText = styled.Text`
  color: #388cea;
  font-size: 18px;
  ${({ theme }) => theme.message.actionSheet.buttonText.css};
`;

const ActionSheetCancelButtonContainer = styled.View`
  align-items: center;
  height: 50px;
  justify-content: center;
  width: 100%;
  ${({ theme }) => theme.message.actionSheet.cancelButtonContainer.css};
`;
const ActionSheetCancelButtonText = styled.Text`
  color: red;
  font-size: 18px;
  ${({ theme }) => theme.message.actionSheet.cancelButtonText.css};
`;

const ActionSheetTitleContainer = styled.View`
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  ${({ theme }) => theme.message.actionSheet.titleContainer.css};
`;

const ActionSheetTitleText = styled.Text`
  font-size: 14px;
  color: #757575;
  ${({ theme }) => theme.message.actionSheet.titleText.css};
`;

const MessageActionSheet = React.forwardRef(
  ({ actionSheetStyles, onActionPress, options }, ref) => {
    const { t } = useContext(TranslationContext);

    return (
      <ActionSheet
        cancelButtonIndex={0}
        destructiveButtonIndex={0}
        onPress={(index) => onActionPress(options[index].id)}
        options={options.map((o, i) => {
          if (i === 0) {
            return (
              <ActionSheetCancelButtonContainer testID='cancel-button'>
                <ActionSheetCancelButtonText>
                  {t('Cancel')}
                </ActionSheetCancelButtonText>
              </ActionSheetCancelButtonContainer>
            );
          }
          return (
            <ActionSheetButtonContainer
              key={o.title}
              testID={`action-sheet-item-${o.title}`}
            >
              <ActionSheetButtonText>{o.title}</ActionSheetButtonText>
            </ActionSheetButtonContainer>
          );
        })}
        ref={ref}
        styles={actionSheetStyles}
        title={
          <ActionSheetTitleContainer testID='action-sheet-container'>
            <ActionSheetTitleText>{t('Choose an action')}</ActionSheetTitleText>
          </ActionSheetTitleContainer>
        }
      />
    );
  },
);

MessageActionSheet.displayName = 'messageActionSheet';

MessageActionSheet.propTypes = {
  /**
   * Style object for action sheet (used to style message actions)
   * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
   */
  actionSheetStyles: PropTypes.object,
  /**
   * Function that runs on press of a message action in the action sheet
   */
  onActionPress: PropTypes.func,
  /**
   * The message actions that populate the action sheet
   */
  options: PropTypes.array,
};

export default MessageActionSheet;
