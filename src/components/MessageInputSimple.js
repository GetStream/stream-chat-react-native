// import React from 'react';
// import { View, Text } from 'react-native';
// import {
//   withChannelContext,
//   withSuggestionsContext,
//   withKeyboardContext,
//   withTranslationContext,
// } from '../context';
// import { logChatPromiseExecution } from 'stream-chat';
// import { ImageUploadPreview } from './ImageUploadPreview';
// import { FileUploadPreview } from './FileUploadPreview';
// import { IconSquare } from './IconSquare';
// import { pickImage, pickDocument } from '../native';
// import { lookup } from 'mime-types';
// import Immutable from 'seamless-immutable';
// import { FileState, ACITriggerSettings } from '../utils';
// import PropTypes from 'prop-types';
// import uniq from 'lodash/uniq';
// import styled from 'styled-components';
// import { themed } from '../styles/theme';
// import { SendButton } from './SendButton';
// import { AttachButton } from './AttachButton';

// import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';
// // import iconMedia from '../images/icons/icon_attach-media.png';

// import iconGallery from '../images/icons/icon_attach-media.png';
// import iconFolder from '../images/icons/icon_folder.png';
// import iconClose from '../images/icons/icon_close.png';
// import { AutoCompleteInput } from './AutoCompleteInput';

// const Container = styled(({ padding, ...rest }) => <View {...rest} />)`
//   display: flex;
//   flex-direction: column;
//   border-radius: 10;
//   background-color: rgba(0, 0, 0, 0.05);
//   padding-top: ${({ theme, padding }) =>
//     padding ? theme.messageInput.container.conditionalPadding : 0}px;
//   margin-left: 10px;
//   margin-right: 10px;
//   ${({ theme }) => theme.messageInput.container.css}
// `;

// const InputBoxContainer = styled.View`
//   display: flex;
//   flex-direction: row;
//   padding-left: 10px;
//   padding-right: 10px;
//   min-height: 46;
//   margin: 10px;
//   align-items: center;
//   ${({ theme }) => theme.messageInput.inputBoxContainer.css}
// `;

// const ActionSheetTitleContainer = styled.View`
//   flex-direction: row;
//   justify-content: space-between;
//   align-items: center;
//   width: 100%;
//   height: 100%;
//   padding-left: 20;
//   padding-right: 20;
//   ${({ theme }) => theme.messageInput.actionSheet.titleContainer.css};
// `;

// const ActionSheetTitleText = styled.Text`
//   font-weight: bold;
//   ${({ theme }) => theme.messageInput.actionSheet.titleText.css};
// `;

// const ActionSheetButtonContainer = styled.View`
//   flex-direction: row;
//   align-items: center;
//   justify-content: flex-start;
//   width: 100%;
//   padding-left: 20;
//   ${({ theme }) => theme.messageInput.actionSheet.buttonContainer.css};
// `;

// const ActionSheetButtonText = styled.Text`
//   ${({ theme }) => theme.messageInput.actionSheet.buttonText.css};
// `;

// export class MessageInputSimple extends React.PureComponent {
//   render() {
//     return (
//       <View style={editingBoxStyles}>
//         {this.props.editing && (
//           <View
//             style={{
//               flexDirection: 'row',
//               alignItems: 'center',
//               justifyContent: 'space-between',
//               padding: 10,
//             }}
//           >
//             <Text style={{ fontWeight: 'bold' }}>{t('Editing Message')}</Text>
//             <IconSquare
//               onPress={() => {
//                 this.props.clearEditingState();
//               }}
//               icon={iconClose}
//             />
//           </View>
//         )}

//         <Container padding={this.state.imageUploads.length > 0}>
//           {this.state.fileUploads && (
//             <FileUploadPreview
//               removeFile={this._removeFile}
//               retryUpload={this._uploadFile}
//               fileUploads={this.state.fileOrder.map(
//                 (id) => this.state.fileUploads[id],
//               )}
//               AttachmentFileIcon={this.props.AttachmentFileIcon}
//             />
//           )}
//           {this.state.imageUploads && (
//             <ImageUploadPreview
//               removeImage={this._removeImage}
//               retryUpload={this._uploadImage}
//               imageUploads={this.state.imageOrder.map(
//                 (id) => this.state.imageUploads[id],
//               )}
//             />
//           )}
//           <InputBoxContainer ref={this.props.setInputBoxContainerRef}>
//             <AttachButton
//               handleOnPress={async () => {
//                 if (hasImagePicker && hasFilePicker) {
//                   await this.props.dismissKeyboard();
//                   this.attachActionSheet.show();
//                 } else if (hasImagePicker && !hasFilePicker) this._pickImage();
//                 else if (!hasImagePicker && hasFilePicker) this._pickFile();
//               }}
//             />
//             {/**
//                       TODO: Use custom action sheet to show icon with titles of button. But it doesn't
//                       work well with async onPress operations. So find a solution.
//                     */}

//             <ActionSheet
//               ref={(o) => (this.attachActionSheet = o)}
//               title={
//                 <ActionSheetTitleContainer>
//                   <ActionSheetTitleText>{t('Add a file')}</ActionSheetTitleText>
//                   <IconSquare
//                     icon={iconClose}
//                     onPress={this.closeAttachActionSheet}
//                   />
//                 </ActionSheetTitleContainer>
//               }
//               options={[
//                 /* eslint-disable */
//                 <AttachmentActionSheetItem
//                   icon={iconGallery}
//                   text={t('Upload a photo')}
//                 />,
//                 <AttachmentActionSheetItem
//                   icon={iconFolder}
//                   text={t('Upload a file')}
//                 />,
//                 /* eslint-enable */
//               ]}
//               onPress={(index) => {
//                 // https://github.com/beefe/react-native-actionsheet/issues/36
//                 setTimeout(() => {
//                   switch (index) {
//                     case 0:
//                       this._pickImage();
//                       break;
//                     case 1:
//                       this._pickFile();
//                       break;
//                     default:
//                   }
//                 }, 1);
//               }}
//               styles={this.props.actionSheetStyles}
//             />
//             <AutoCompleteInput
//               openSuggestions={this.props.openSuggestions}
//               closeSuggestions={this.props.closeSuggestions}
//               updateSuggestions={this.props.updateSuggestions}
//               value={this.state.text}
//               onChange={this.onChange}
//               getCommands={this.getCommands}
//               setInputBoxRef={this.setInputBoxRef}
//               triggerSettings={ACITriggerSettings({
//                 users: this.getUsers(),
//                 commands: this.getCommands(),
//                 onMentionSelectItem: this.onSelectItem,
//                 t,
//               })}
//               additionalTextInputProps={this.props.additionalTextInputProps}
//             />
//             <SendButton
//               title={t('Send message')}
//               sendMessage={this.sendMessage}
//               editing={this.props.editing}
//             />
//           </InputBoxContainer>
//         </Container>
//       </View>
//     );
//   }
// }
