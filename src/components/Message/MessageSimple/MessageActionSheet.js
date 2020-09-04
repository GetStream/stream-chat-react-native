import React, { useContext } from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';

import { TranslationContext } from '../../../context';
import { MESSAGE_ACTIONS } from '../../../utils/utils';

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

const MessageActionSheet = React.forwardRef((props, ref) => {
  const {
    actionSheetStyles,
    handleDelete,
    handleEdit,
    openReactionPicker,
    openThread,
    options,
    setActionSheetVisible,
  } = props;

  const { t } = useContext(TranslationContext);

  const onActionPress = async (action) => {
    switch (action) {
      case MESSAGE_ACTIONS.edit:
        handleEdit();
        break;
      case MESSAGE_ACTIONS.delete:
        await handleDelete();
        break;
      case MESSAGE_ACTIONS.reply:
        openThread();
        break;
      case MESSAGE_ACTIONS.reactions:
        openReactionPicker();
        break;
      default:
        break;
    }
    setActionSheetVisible(false);
  };

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
});

MessageActionSheet.displayName = 'messageActionSheet';

MessageActionSheet.propTypes = {
  /**
   * Style object for action sheet (used to style message actions)
   * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
   */
  actionSheetStyles: PropTypes.object,
  /**
   * Function that returns a boolean indicating whether or not the user can delete the message.
   */
  canDeleteMessage: PropTypes.func,
  /**
   * Function that returns a boolean indicating whether or not the user can edit the message.
   */
  canEditMessage: PropTypes.func,
  /**
   * Handler to delete a current message.
   */
  handleDelete: PropTypes.func,
  /**
   * Handler to edit a current message. This function sets the current message as the `editing` property of channel context.
   * The `editing` prop is used by the MessageInput component to switch to edit mode.
   */
  handleEdit: PropTypes.func,
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'reactions', 'reply']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
  /**
   * Function that opens the reaction picker
   */
  openReactionPicker: PropTypes.func,
  /**
   * Function that opens a thread and gives the option to add a reply on a message
   */
  openThread: PropTypes.func,
  /**
   * The message actions that populate the action sheet
   */
  options: PropTypes.array,
  /**
   * The action sheet ref declared in MessageContent. To access the ref, ensure the ActionSheet custom
   * component is wrapped in `React.forwardRef`.
   */
  ref: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  /**
   * React useState hook setter function that toggles action sheet visibility
   */
  setActionSheetVisible: PropTypes.func,
};

export default MessageActionSheet;
