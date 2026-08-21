import type { TranslationDictionary } from 'stream-chat-react-native';

/**
 * German UI copy for the Stream Chat SDK.
 *
 * The key type is `TranslationDictionary`, so every key here is checked against the SDK's
 * generated catalog: a typo, or a key that disappears in a future release, is a compile error
 * rather than a string that silently never renders.
 *
 * This file is deliberately complete, but it does not have to be. Any key you leave out renders
 * its English copy — never a raw `dotted.key` — so translating incrementally is safe.
 *
 * Registered in ./index.ts. Dates need one extra step; see ./README.md.
 */
export const de: TranslationDictionary = {
  // Connection + screen-reader status
  'a11y.connection.connected.accessibilityLabel': 'Verbunden',
  'a11y.connection.offline.accessibilityLabel': 'Offline',
  'a11y.connection.reconnecting.accessibilityLabel': 'Verbindung wird wiederhergestellt',
  'a11y.newMessage.withUser.accessibilityLabel': 'Neue Nachricht von {{user}}',
  'a11y.newMessages.withCount.accessibilityLabel': '{{count}} neue Nachrichten',

  // AI typing indicator
  'aiTypingIndicator.generating.label': 'Wird generiert...',
  'aiTypingIndicator.thinking.label': 'Denkt nach...',

  // Attachments
  'attachment.gallery.doubleTapToOpen.accessibilityLabel': 'Zum Öffnen doppeltippen',
  'attachment.gallery.image.accessibilityLabel': 'Galeriebild',
  'attachment.gallery.moreImages.label_one': '+{{count}}',
  'attachment.gallery.moreImages.label_other': '+{{count}}',
  'attachment.gallery.video.accessibilityLabel': 'Galerievideo',
  'attachment.giphy.onlyVisibleToYou.text': 'Nur für dich sichtbar',
  'attachment.unsupported.title': 'Nicht unterstützter Anhang',

  // Attachment picker
  'attachmentPicker.camera.denied.description': 'Du hast keinen Zugriff auf die Kamera gewährt',
  'attachmentPicker.camera.description': 'Foto aufnehmen und teilen',
  'attachmentPicker.camera.label': 'Kamera öffnen',
  'attachmentPicker.camera.videoOnly.description': 'Video aufnehmen und teilen',
  'attachmentPicker.commands.title': 'Sofortbefehle',
  'attachmentPicker.files.description': 'Dateien zum Teilen auswählen',
  'attachmentPicker.files.label': 'Dateien öffnen',
  'attachmentPicker.image.deselect.accessibilityLabel': 'Bild abwählen',
  'attachmentPicker.image.select.accessibilityLabel': 'Bild auswählen',
  'attachmentPicker.maxFiles.error': 'Maximale Anzahl an Dateien erreicht',
  'attachmentPicker.openSettings.label': 'In Einstellungen ändern',
  'attachmentPicker.photoLibrary.addMore.label': 'Mehr hinzufügen',
  'attachmentPicker.photoLibrary.denied.description':
    'Du hast keinen Zugriff auf die Fotobibliothek gewährt.',
  'attachmentPicker.poll.description': 'Umfrage erstellen und alle abstimmen lassen',
  'attachmentPicker.poll.label': 'Umfrage erstellen',
  'attachmentPicker.typeButton.camera.accessibilityLabel': 'Kamera öffnen',
  'attachmentPicker.typeButton.commands.accessibilityLabel': 'Befehle öffnen',
  'attachmentPicker.typeButton.files.accessibilityLabel': 'Dateiauswahl öffnen',
  'attachmentPicker.typeButton.images.accessibilityLabel': 'Fotoauswahl öffnen',
  'attachmentPicker.typeButton.poll.accessibilityLabel': 'Umfrageerstellung öffnen',
  'attachmentPicker.typeButton.videoRecorder.accessibilityLabel': 'Videorekorder öffnen',
  'attachmentPicker.video.deselect.accessibilityLabel': 'Video abwählen',
  'attachmentPicker.video.select.accessibilityLabel': 'Video auswählen',

  // Audio player
  'audioPlayer.formatUnsupported.error':
    'Das Aufnahmeformat wird nicht unterstützt und kann nicht wiedergegeben werden',
  'audioPlayer.playbackFailed.error': 'Aufnahme konnte nicht wiedergegeben werden',
  'audioPlayer.seekUnsupported.error': 'In der Aufnahme kann nicht gespult werden',

  // Autocomplete (mentions, commands, emoji)
  'autoCompleteInput.mention.channel.description': 'Alle in diesem Kanal benachrichtigen',
  'autoCompleteInput.mention.here.description':
    'Alle Online-Mitglieder in diesem Kanal benachrichtigen',
  'autoCompleteInput.mention.role.description': 'Alle {{ role }}-Mitglieder benachrichtigen',
  'autoCompleteInput.placeholder': 'Nachricht senden',
  'autoCompleteInput.slowMode.placeholder': 'Langsamer Modus, warte {{seconds}}s...',
  'autoCompleteInput.suggestions.commandsAvailable.accessibilityLabel':
    'Befehlsvorschläge verfügbar',
  'autoCompleteInput.suggestions.emojisAvailable.accessibilityLabel': 'Emoji-Vorschläge verfügbar',
  'autoCompleteInput.suggestions.mentionsAvailable.accessibilityLabel':
    'Erwähnungsvorschläge verfügbar',

  // Avatars
  'avatar.accessibilityLabel': 'Avatar von {{name}}',
  'avatar.channel.direct.accessibilityLabel': 'Direktchat mit {{name}}',
  'avatar.channel.group.accessibilityLabel': 'Kanal mit {{count}} Mitgliedern',

  // Channel screen, system messages and errors
  'channel.addMembersFailed.error': 'Mitglieder konnten nicht hinzugefügt werden',
  'channel.archiveUpdateFailed.error':
    'Archivierungsstatus des Kanals konnte nicht aktualisiert werden',
  'channel.archived.text': 'Kanal archiviert',
  'channel.blockUserFailed.error': 'Benutzer konnte nicht blockiert werden',
  'channel.deleteChat.confirm.text':
    'Diesen Chat wirklich löschen? Das kann nicht rückgängig gemacht werden.',
  'channel.deleteChat.label': 'Chat löschen',
  'channel.deleteChat.title': 'Chat löschen',
  'channel.deleteFailed.error': 'Kanal konnte nicht gelöscht werden',
  'channel.deleteGroup.confirm.text':
    'Diese Gruppe wirklich löschen? Das kann nicht rückgängig gemacht werden.',
  'channel.deleteGroup.label': 'Gruppe löschen',
  'channel.deleteGroup.title': 'Gruppe löschen',
  'channel.deleted.text': 'Kanal gelöscht',
  'channel.imageUpdateFailed.error': 'Kanalbild konnte nicht aktualisiert werden',
  'channel.imageUpdated.text': 'Kanalbild aktualisiert',
  'channel.jumpToFirstUnreadFailed.error': 'Sprung zur ersten ungelesenen Nachricht fehlgeschlagen',
  'channel.leave.confirm.groupName.text': 'dieser Gruppe',
  'channel.leave.confirm.label': 'Verlassen',
  'channel.leave.confirm.text':
    'Du erhältst keine Nachrichten mehr von {{ name }}. Du kannst jederzeit wieder beitreten.',
  'channel.leaveChat.label': 'Chat verlassen',
  'channel.leaveFailed.error': 'Kanal konnte nicht verlassen werden',
  'channel.leaveGroup.label': 'Gruppe verlassen',
  'channel.left.text': 'Kanal verlassen',
  'channel.membersAdded.text_one': '{{count}} Mitglied hinzugefügt',
  'channel.membersAdded.text_other': '{{count}} Mitglieder hinzugefügt',
  'channel.membersRemoved.text_one': '{{count}} Mitglied entfernt',
  'channel.membersRemoved.text_other': '{{count}} Mitglieder entfernt',
  'channel.muteChat.label': 'Chat stummschalten',
  'channel.muteGroup.label': 'Gruppe stummschalten',
  'channel.muteUpdateFailed.error': 'Stummschaltung des Kanals konnte nicht aktualisiert werden',
  'channel.muted.text': 'Kanal stummgeschaltet',
  'channel.nameUpdateFailed.error': 'Kanalname konnte nicht aktualisiert werden',
  'channel.nameUpdated.text': 'Kanalname aktualisiert',
  'channel.noneSelected.text': 'Bitte zuerst einen Kanal auswählen',
  'channel.pinChat.label': 'Chat anheften',
  'channel.pinGroup.label': 'Gruppe anheften',
  'channel.pinUpdateFailed.error': 'Anheftungsstatus des Kanals konnte nicht aktualisiert werden',
  'channel.pinned.text': 'Kanal angeheftet',
  'channel.removeMembersFailed.error': 'Mitglieder konnten nicht entfernt werden',
  'channel.removeUser.confirm.label': 'Entfernen',
  'channel.removeUser.confirm.text': 'Dieses Mitglied wirklich aus dem Kanal entfernen?',
  'channel.removeUser.label': 'Benutzer entfernen',
  'channel.unarchived.text': 'Kanal aus dem Archiv entfernt',
  'channel.unmuteChat.label': 'Chat-Stummschaltung aufheben',
  'channel.unmuteGroup.label': 'Gruppen-Stummschaltung aufheben',
  'channel.unmuted.text': 'Kanal nicht mehr stummgeschaltet',
  'channel.unpinChat.label': 'Chat nicht mehr anheften',
  'channel.unpinGroup.label': 'Gruppe nicht mehr anheften',
  'channel.unpinned.text': 'Kanal nicht mehr angeheftet',
  'channel.userBlocked.text': 'Benutzer blockiert',
  'channel.userUnblocked.text': 'Benutzer entblockiert',

  // Channel details screen
  'channelDetails.addMembers.accessibilityLabel': 'Mitglieder hinzufügen',
  'channelDetails.addMembers.alreadyMember.accessibilityLabel': '{{name}} ist bereits Mitglied',
  'channelDetails.addMembers.alreadyMember.text': 'Bereits Mitglied',
  'channelDetails.addMembers.confirm.accessibilityLabel': 'Hinzufügen von Mitgliedern bestätigen',
  'channelDetails.addMembers.label': 'Hinzufügen',
  'channelDetails.addMembers.load.error': 'Benutzer konnten nicht geladen werden',
  'channelDetails.addMembers.noUserFound.label': 'Kein Benutzer gefunden',
  'channelDetails.addMembers.search.accessibilityLabel': 'Benutzer zum Hinzufügen suchen',
  'channelDetails.addMembers.selectUser.accessibilityLabel': '{{name}} auswählen',
  'channelDetails.addMembers.title': 'Mitglieder hinzufügen',
  'channelDetails.editChannel.accessibilityLabel': 'Kanal bearbeiten',
  'channelDetails.editChannel.confirm.accessibilityLabel': 'Bearbeiten des Kanals bestätigen',
  'channelDetails.editChannel.label': 'Bearbeiten',
  'channelDetails.editChannel.name.accessibilityLabel': 'Kanalname',
  'channelDetails.editChannel.name.placeholder': 'Kanalname',
  'channelDetails.editChannel.upload.accessibilityLabel': 'Kanalbild hochladen',
  'channelDetails.editChannel.upload.label': 'Hochladen',
  'channelDetails.editImageSheet.chooseImage.label': 'Bild auswählen',
  'channelDetails.editImageSheet.close.accessibilityLabel':
    'Fenster zum Bearbeiten des Bildes schließen',
  'channelDetails.editImageSheet.resetPicture.label': 'Bild zurücksetzen',
  'channelDetails.editImageSheet.takePhoto.label': 'Foto aufnehmen',
  'channelDetails.editImageSheet.title': 'Gruppenbild bearbeiten',
  'channelDetails.fileAttachmentList.empty.description': 'Teile eine Datei, um sie hier zu sehen',
  'channelDetails.fileAttachmentList.empty.title': 'Keine Dateien',
  'channelDetails.fileAttachmentList.load.error': 'Dateien konnten nicht geladen werden',
  'channelDetails.header.back.accessibilityLabel': 'Zurück',
  'channelDetails.header.contactInfo.title': 'Kontaktinfo',
  'channelDetails.header.groupInfo.title': 'Gruppeninfo',
  'channelDetails.mediaList.empty.description': 'Teile ein Foto oder Video, um es hier zu sehen',
  'channelDetails.mediaList.empty.title': 'Keine Fotos oder Videos',
  'channelDetails.mediaList.load.error': 'Medien konnten nicht geladen werden',
  'channelDetails.memberList.load.error': 'Mitglieder konnten nicht geladen werden',
  'channelDetails.memberList.noMembersFound.label': 'Keine Mitglieder gefunden',
  'channelDetails.memberList.search.accessibilityLabel': 'Mitglieder suchen',
  'channelDetails.memberRoles.admin.label': 'Administrator',
  'channelDetails.memberRoles.moderator.label': 'Moderator',
  'channelDetails.memberRoles.owner.label': 'Eigentümer',
  'channelDetails.memberSection.title_one': '{{count}} Mitglied',
  'channelDetails.memberSection.title_other': '{{count}} Mitglieder',
  'channelDetails.memberSection.viewAll.label': 'Alle anzeigen',
  'channelDetails.muted.accessibilityLabel': 'Stummgeschaltet',
  'channelDetails.navigation.files.label': 'Dateien',
  'channelDetails.navigation.photosAndVideos.label': 'Fotos & Videos',
  'channelDetails.navigation.pinnedMessages.label': 'Angeheftete Nachrichten',
  'channelDetails.pinnedMessageList.empty.description':
    'Halte eine Nachricht gedrückt, um sie im Chat anzuheften',
  'channelDetails.pinnedMessageList.empty.title': 'Keine angehefteten Nachrichten',
  'channelDetails.pinnedMessageList.load.error':
    'Angeheftete Nachrichten konnten nicht geladen werden',
  'channelDetails.pinnedMessageList.search.accessibilityLabel':
    'Angeheftete Nachrichten durchsuchen',
  'channelDetails.presence.membersOnline.label_one':
    '{{memberCount}} Mitglied, {{onlineCount}} online',
  'channelDetails.presence.membersOnline.label_other':
    '{{memberCount}} Mitglieder, {{onlineCount}} online',

  // Channel list
  'channelList.header.loadFailed.error': 'Fehler beim Laden, bitte neu laden',

  // Channel list row
  'channelPreview.deliveryStatus.delivered.accessibilityLabel': 'Zugestellt, von dir gesendet',
  'channelPreview.deliveryStatus.read.accessibilityLabel': 'Gelesen, von dir gesendet',
  'channelPreview.deliveryStatus.sent.accessibilityLabel': 'Von dir gesendet',
  'channelPreview.displayName.others.label': 'und {{ count }} weitere',
  'channelPreview.lastMessage.accessibilityLabel': 'Letzte Nachricht {{date}}',
  'channelPreview.messageFailed.error': 'Nachricht konnte nicht gesendet werden',
  'channelPreview.muted.accessibilityLabel': 'Stummgeschaltet',
  'channelPreview.noMessages.text': 'Noch keine Nachrichten',
  'channelPreview.pinned.accessibilityLabel': 'Angeheftet',
  'channelPreview.pollVote.byYou.label': 'Du hast abgestimmt: {{ option }}',
  'channelPreview.pollVote.withUser.label': '{{ user }} hat abgestimmt: {{ option }}',
  'channelPreview.typing.label': 'Tippt',
  'channelPreview.typing.withTwoUsers.label': '{{ firstUser }} und {{ secondUser }} tippen',
  'channelPreview.typing.withUser.label': '{{ user }} tippt',
  'channelPreview.typing.withUserCount.label': '{{ numberOfUsers }} Personen tippen',
  'channelPreview.unreadCount.accessibilityLabel': '{{count}} ungelesene Nachrichten',

  // Shared labels reused across screens
  'common.anonymousUser.label': 'Anonym',
  'common.cameraPermission.text':
    'Die Kamera des Geräts wird verwendet, um Fotos oder Videos aufzunehmen.',
  'common.cameraPermission.title': 'Kamerazugriff in den Geräteeinstellungen erlauben',
  'common.cancel.label': 'Abbrechen',
  'common.close.accessibilityLabel': 'Schließen',
  'common.draft.label': 'Entwurf',
  'common.editMessageFailed.error': 'Anfrage zum Bearbeiten der Nachricht fehlgeschlagen',
  'common.galleryPermission.text':
    'Die Galerie-Berechtigungen des Geräts werden verwendet, um Fotos oder Videos aufzunehmen.',
  'common.galleryPermission.title': 'Zugriff auf deine Galerie erlauben',
  'common.linksDisabled.text': 'Das Senden von Links ist in dieser Unterhaltung nicht erlaubt',
  'common.linksDisabled.title': 'Links sind deaktiviert',
  'common.loading.text': 'Wird geladen ...',
  'common.messageOverlay.swipeHint.accessibilityLabel':
    'Nach rechts wischen, um die verschiedenen Aktionen durchzugehen',
  'common.openSettings.label': 'Einstellungen öffnen',
  'common.presence.offline.label': 'Offline',
  'common.presence.online.label': 'Online',
  'common.reconnecting.text': 'Verbindung wird wiederhergestellt ...',
  'common.sendMessageFailed.error': 'Anfrage zum Senden der Nachricht fehlgeschlagen',
  'common.unknownUser.label': 'Unbekannter Benutzer',
  'common.you.label': 'Du',

  // Image gallery
  'imageGallery.footer.grid.accessibilityLabel': 'Rastersymbol',
  'imageGallery.footer.position.text': '{{ index }} von {{ photoLength }}',
  'imageGallery.footer.share.accessibilityLabel': 'Schaltfläche Teilen',
  'imageGallery.header.hideOverlay.accessibilityLabel': 'Overlay ausblenden',
  'imageGallery.position.accessibilityLabel': '{{position}} von {{count}}',
  'imageGallery.videoControl.playPause.accessibilityLabel': 'Schaltfläche Wiedergabe/Pause',

  // Empty / loading / error states
  'indicators.emptyState.noChats.text': 'Noch keine Chats hier…',
  'indicators.emptyState.noConversations.text': 'Noch keine Unterhaltungen',
  'indicators.emptyState.noItems.text': 'Keine Einträge vorhanden',
  'indicators.emptyState.noThreads.text':
    'Auf eine Nachricht antworten, um einen Thread zu starten',
  'indicators.loading.channels.error': 'Fehler beim Laden der Kanalliste...',
  'indicators.loading.channels.text': 'Kanäle werden geladen...',
  'indicators.loading.error': 'Fehler beim Laden',
  'indicators.loading.messages.error': 'Fehler beim Laden der Nachrichten für diesen Kanal...',
  'indicators.loading.messages.text': 'Nachrichten werden geladen...',

  // Message bubble, actions and status
  'message.banUser.label': 'Benutzer sperren',
  'message.blockUser.label': 'Benutzer blockieren',
  'message.blockUserConfirm.label': 'Blockieren',
  'message.blockUserConfirm.text':
    'Diese Person kann dir keine Nachrichten mehr senden und dich nicht anrufen. Du kannst die Blockierung später aufheben.',
  'message.blockUserConfirm.title': '{{ name }} blockieren',
  'message.bounce.sendAnyway.label': 'Trotzdem senden',
  'message.bounce.text':
    'Überlege, wie dein Kommentar auf andere wirken könnte, und halte dich an unsere Community-Richtlinien',
  'message.bounce.title': 'Bist du sicher?',
  'message.content.contextMenuHint.accessibilityLabel':
    'Doppelt tippen und halten, um das Kontextmenü zu öffnen',
  'message.content.fromSender.accessibilityLabel': 'Nachricht von {{sender}}',
  'message.content.fromYou.accessibilityLabel': 'Nachricht von dir',
  'message.copied.text': 'Nachricht in die Zwischenablage kopiert',
  'message.copyMessage.error': 'Nachricht konnte nicht kopiert werden',
  'message.copyMessage.label': 'Nachricht kopieren',
  'message.deleteForMe.label': 'Für mich löschen',
  'message.deleteMessage.error': 'Fehler beim Löschen der Nachricht',
  'message.deleteMessage.label': 'Nachricht löschen',
  'message.deleteMessageConfirm.label': 'Löschen',
  'message.deleteMessageConfirm.text': 'Möchtest du diese Nachricht wirklich endgültig löschen?',
  'message.deleted.text': 'Nachricht gelöscht',
  'message.editMessage.label': 'Nachricht bearbeiten',
  'message.edited.text': 'Bearbeitet',
  'message.flagMessage.error': 'Fehler beim Melden',
  'message.flagMessage.label': 'Nachricht melden',
  'message.flagMessageConfirm.label': 'Melden',
  'message.flagMessageConfirm.text':
    'Möchtest du eine Kopie dieser Nachricht zur weiteren Prüfung an einen Moderator senden?',
  'message.flagged.text': 'Nachricht wurde erfolgreich gemeldet',
  'message.markUnread.label': 'Als ungelesen markieren',
  'message.markUnreadTooOld.error':
    'Fehler beim Markieren als ungelesen. Nachrichten, die älter als die 100 neuesten Nachrichten des Kanals sind, können nicht als ungelesen markiert werden.',
  'message.markedUnread.text': 'Nachricht als ungelesen markiert',
  'message.muteUser.error': 'Fehler beim Stummschalten eines Benutzers ...',
  'message.muteUser.label': 'Benutzer stummschalten',
  'message.pinMessage.error': 'Fehler beim Anheften der Nachricht',
  'message.pinMessage.label': 'An Unterhaltung anheften',
  'message.pinned.text': 'Nachricht angeheftet',
  'message.pinnedBy.text': 'Angeheftet von',
  'message.reactionList.more.accessibilityLabel': 'und {{count}} weitere Reaktionen',
  'message.reactionList.viewHint.accessibilityLabel':
    'Doppelt tippen, um die Reaktionen anzuzeigen',
  'message.reactionList.youReacted.accessibilityLabel': 'du hast reagiert',
  'message.reminderOverdue.text': 'Erinnerung überfällig',
  'message.reminderSet.text': 'Erinnerung gesetzt',
  'message.replies.many.label': '{{ replyCount }} Antworten',
  'message.replies.one.label': '1 Antwort',
  'message.replies.viewHint.accessibilityLabel': 'Doppelt tippen, um den Thread anzuzeigen',
  'message.reply.label': 'Antworten',
  'message.resend.label': 'Erneut senden',
  'message.savedForLater.text': 'Für später gespeichert',
  'message.sentToChannelHeader.alsoSent.text': 'Auch im Kanal gesendet',
  'message.sentToChannelHeader.repliedToThread.text': 'Auf einen Thread geantwortet',
  'message.sentToChannelHeader.view.label': 'Ansehen',
  'message.status.delivered.accessibilityLabel': 'Zugestellt',
  'message.status.read.accessibilityLabel': 'Gelesen',
  'message.status.sending.accessibilityLabel': 'Wird gesendet',
  'message.status.sent.accessibilityLabel': 'Gesendet',
  'message.threadReply.label': 'Im Thread antworten',
  'message.unbanUser.label': 'Sperre aufheben',
  'message.unblockUser.label': 'Blockierung aufheben',
  'message.unmuteUser.error': 'Fehler beim Aufheben der Stummschaltung eines Benutzers ...',
  'message.unmuteUser.label': 'Stummschaltung aufheben',
  'message.unpinMessage.error': 'Fehler beim Aufheben der Anheftung',
  'message.unpinMessage.label': 'Anheftung aufheben',
  'message.unpinned.text': 'Nachricht nicht mehr angeheftet',
  'message.userMuted.text': '{{ user }} wurde stummgeschaltet',
  'message.userUnmuted.text': 'Stummschaltung von {{ user }} wurde aufgehoben',

  // Message input and voice recorder
  'messageInput.addAttachment.accessibilityLabel': 'Anhang hinzufügen',
  'messageInput.alsoSendToChannel.label': 'Auch an Kanal senden',
  'messageInput.attachmentUpload.network.error': 'Netzwerkfehler',
  'messageInput.attachmentUpload.notSupported.error': 'Nicht unterstützt',
  'messageInput.attachmentUpload.retry.label': 'Hochladen erneut versuchen',
  'messageInput.attachmentUpload.tooLarge.error': 'Datei zu groß',
  'messageInput.audioRecorder.delete.accessibilityLabel': 'Sprachaufnahme löschen',
  'messageInput.audioRecorder.holdToRecord.text': 'Zum Aufnehmen halten. Zum Speichern loslassen.',
  'messageInput.audioRecorder.permissionDenied.text':
    'Bitte Audio-Berechtigungen in den Einstellungen erlauben.',
  'messageInput.audioRecorder.recordingDeleted.text': 'Sprachnachricht gelöscht',
  'messageInput.audioRecorder.send.accessibilityLabel': 'Sprachaufnahme senden',
  'messageInput.audioRecorder.slideToCancel.text': 'Zum Abbrechen wischen',
  'messageInput.audioRecorder.start.accessibilityLabel': 'Sprachaufnahme starten',
  'messageInput.audioRecorder.stop.accessibilityLabel': 'Sprachaufnahme stoppen',
  'messageInput.closeAttachments.accessibilityLabel': 'Anhänge schließen',
  'messageInput.removeAttachment.accessibilityLabel': 'Anhang entfernen',
  'messageInput.saveEdit.accessibilityLabel': 'Bearbeitete Nachricht speichern',
  'messageInput.sendMessage.accessibilityLabel': 'Nachricht senden',
  'messageInput.sendMessageDisallowed.text': 'Du kannst in diesem Kanal keine Nachrichten senden',

  // Message list
  'messageList.dismissUnread.accessibilityLabel': 'Ungelesene Nachrichten ausblenden',
  'messageList.newMessages.text': '{{count}} neue Nachrichten',
  'messageList.scrollToBottom.accessibilityLabel': 'Nach unten scrollen',
  'messageList.scrollToBottom.withCount.accessibilityLabel':
    'Nach unten scrollen, {{count}} neue Nachrichten',
  'messageList.typing.withMoreUsers.label':
    '{{ firstUser }} und {{ nonSelfUserLength }} weitere tippen',
  'messageList.unreadMessages.label': 'Ungelesene Nachrichten',
  'messageList.unreadMessages.withCount.label': '{{count}} ungelesen',

  // Message action menu
  'messageMenu.actionList.accessibilityLabel': 'Nachrichtenaktionen',
  'messageMenu.reactionPicker.moreReactions.accessibilityLabel': 'Weitere Reaktionen öffnen',
  'messageMenu.userReactions.fetchFailed.error': 'Fehler beim Laden der Reaktionen',
  'messageMenu.userReactions.tapToRemove.description': 'Zum Entfernen tippen',
  'messageMenu.userReactions.title_one': '{{count}} Reaktion',
  'messageMenu.userReactions.title_other': '{{count}} Reaktionen',

  // Message preview (channel list + threads)
  'messagePreview.audio.label': 'Audio',
  'messagePreview.audios.label_one': '{{count}} Audio',
  'messagePreview.audios.label_other': '{{count}} Audios',
  'messagePreview.files.label_one': '{{count}} Datei',
  'messagePreview.files.label_other': '{{count}} Dateien',
  'messagePreview.giphy.label': 'Giphy',
  'messagePreview.liveLocation.label': 'Live-Standort',
  'messagePreview.location.label': 'Standort',
  'messagePreview.photo.label': 'Foto',
  'messagePreview.photos.label_one': '{{count}} Foto',
  'messagePreview.photos.label_other': '{{count}} Fotos',
  'messagePreview.video.label': 'Video',
  'messagePreview.videos.label_one': '{{count}} Video',
  'messagePreview.videos.label_other': '{{count}} Videos',
  'messagePreview.voiceMessage.label': 'Sprachnachricht ({{duration}})',
  'messagePreview.voiceMessages.label_one': '{{count}} Sprachnachricht',
  'messagePreview.voiceMessages.label_other': '{{count}} Sprachnachrichten',

  // Toasts and inline notifications
  'notifications.attachmentFileMissing.error': 'Für den Anhang ist eine Datei erforderlich',
  'notifications.attachmentIdMissing.error': 'Lokale ID für den hochzuladenden Anhang fehlt',
  'notifications.attachmentUploadBlocked.error': 'Hochladen des Anhangs blockiert wegen {{reason}}',
  'notifications.attachmentUploadBlocked.reason.sizeLimit.text': 'Größenbeschränkung',
  'notifications.attachmentUploadBlocked.reason.unknownError.text': 'unbekannter Fehler',
  'notifications.attachmentUploadBlocked.reason.unsupportedFileType.text':
    'nicht unterstützter Dateityp',
  'notifications.attachmentUploadFailed.error': 'Fehler beim Hochladen des Anhangs',
  'notifications.attachmentUploadFailed.withReason.error':
    'Hochladen des Anhangs fehlgeschlagen wegen {{reason}}',
  'notifications.attachmentUploadInProgress.error': 'Warte, bis alle Anhänge hochgeladen sind',
  'notifications.commandNotReady.error': 'Befehl kann noch nicht gesendet werden',
  'notifications.commandUnavailable.error': 'Befehl nicht verfügbar',
  'notifications.commandUnavailable.whileEditing.error': 'Befehl beim Bearbeiten nicht verfügbar',
  'notifications.commandUnavailable.whileReplying.error': 'Befehl beim Antworten nicht verfügbar',
  'notifications.dismiss.accessibilityLabel': 'Benachrichtigung schließen',
  'notifications.list.accessibilityLabel': 'Benachrichtigungen',
  'notifications.locationShareFailed.error': 'Standort konnte nicht geteilt werden',
  'notifications.messageJumpFailed.error': 'Sprung zur Nachricht fehlgeschlagen',
  'notifications.messageJumpToLatestFailed.error': 'Sprung zur neuesten Nachricht fehlgeschlagen',
  'notifications.pollCreateFailed.error': 'Umfrage konnte nicht erstellt werden',
  'notifications.pollCreateFailed.withReason.error':
    'Umfrage konnte nicht erstellt werden wegen {{reason}}',
  'notifications.pollEndFailed.withReason.error':
    'Umfrage konnte nicht beendet werden wegen {{reason}}',
  'notifications.pollEnded.text': 'Umfrage beendet',
  'notifications.recordingPlaybackFailed.error': 'Fehler beim Abspielen der Aufnahme',
  'notifications.voteLimitReached.error':
    'Stimmenlimit erreicht. Entferne zuerst eine vorhandene Stimme.',

  // Polls
  'poll.addComment.description': 'Kommentar zur Umfrage hinzufügen',
  'poll.addComment.label': 'Kommentar hinzufügen',
  'poll.addComment.placeholder': 'Dein Kommentar',
  'poll.allOptions.title': 'Umfrageoptionen',
  'poll.comments.title': 'Umfragekommentare',
  'poll.createPoll.anonymousVoting.description': 'Verbergen, wer abgestimmt hat',
  'poll.createPoll.anonymousVoting.label': 'Anonyme Abstimmung',
  'poll.createPoll.close.accessibilityLabel': 'Umfrageerstellung schließen',
  'poll.createPoll.maxVotes.decrease.accessibilityLabel': 'Maximale Stimmenzahl verringern',
  'poll.createPoll.maxVotes.description': 'Zwischen 2–10 Optionen wählen',
  'poll.createPoll.maxVotes.increase.accessibilityLabel': 'Maximale Stimmenzahl erhöhen',
  'poll.createPoll.maxVotes.label': 'Stimmen pro Person begrenzen',
  'poll.createPoll.multipleVotes.description': 'Mehr als eine Option auswählen',
  'poll.createPoll.multipleVotes.label': 'Mehrere Stimmen',
  'poll.createPoll.options.duplicate.error': 'Option existiert bereits',
  'poll.createPoll.options.empty.error': 'Option ist leer',
  'poll.createPoll.options.label': 'Optionen',
  'poll.createPoll.options.placeholder': 'Option hinzufügen',
  'poll.createPoll.question.label': 'Fragen',
  'poll.createPoll.question.placeholder': 'Frage stellen',
  'poll.createPoll.submit.accessibilityLabel': 'Umfrage erstellen',
  'poll.endVote.error': 'Umfrage konnte nicht beendet werden',
  'poll.endVote.label': 'Abstimmung beenden',
  'poll.inputDialog.send.label': 'Senden',
  'poll.modalHeader.close.accessibilityLabel': 'Umfrage schließen',
  'poll.moreOptions.label_one': '+{{count}} weitere Option',
  'poll.moreOptions.label_other': '+{{count}} weitere Optionen',
  'poll.question.label': 'Frage',
  'poll.results.optionNumber.text': 'Option {{count}}',
  'poll.results.showAll.label': 'Alle anzeigen',
  'poll.results.title': 'Umfrageergebnisse',
  'poll.subtitle.ended.text': 'Umfrage beendet',
  'poll.subtitle.selectAny.text': 'Eine oder mehrere auswählen',
  'poll.subtitle.selectOne.text': 'Eine auswählen',
  'poll.subtitle.selectUpTo.text_one': 'Bis zu {{count}} auswählen',
  'poll.subtitle.selectUpTo.text_other': 'Bis zu {{count}} auswählen',
  'poll.suggestOption.description': 'Andere können Optionen hinzufügen',
  'poll.suggestOption.label': 'Option vorschlagen',
  'poll.suggestOption.placeholder': 'Neue Option eingeben',
  'poll.updateComment.label': 'Kommentar aktualisieren',
  'poll.viewComments.label_one': '{{count}} Kommentar ansehen',
  'poll.viewComments.label_other': '{{count}} Kommentare ansehen',
  'poll.viewResults.label': 'Ergebnisse ansehen',
  'poll.votes.text_one': '{{count}} Stimme',
  'poll.votes.text_other': '{{count}} Stimmen',
  'poll.votes.title': 'Stimmen',

  // Quoted replies
  'reply.editingMessage.accessibilityLabel': 'Nachricht wird bearbeitet',
  'reply.editingMessage.withText.accessibilityLabel': 'Nachricht wird bearbeitet: {{text}}',
  'reply.removeEdit.accessibilityLabel': 'Bearbeitung verwerfen',
  'reply.removeReply.accessibilityLabel': 'Antwort entfernen',
  'reply.replyTo.title': 'Antwort an {{name}}',
  'reply.replying.withUser.accessibilityLabel': 'Antwort an {{user}}',
  'reply.replying.withUserAndText.accessibilityLabel': 'Antwort an {{user}}: {{text}}',

  // Thread list
  'threadList.unreadBanner.loadFailed.error':
    'Neue Threads konnten nicht geladen werden. Tippen, um es erneut zu versuchen',
  'threadList.unreadBanner.newThreads.label': '{{count}} neue Threads',

  // Shared UI primitives
  'uiComponents.bottomSheetModal.opened.accessibilityLabel':
    'Bottom Sheet geöffnet. Aktiviere die Aktion zum Schließen oder verwende die Escape-Geste, um es zu schließen.',
  'uiComponents.searchInput.clear.accessibilityLabel': 'Suche löschen',
  'uiComponents.searchInput.placeholder': 'Suchen',

  // Dates and times — see the note in README.md
  'timestamp.ChannelPreviewStatus':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Gestern]", "lastWeek":"dddd", "nextDay":"[Morgen]", "nextWeek":"dddd [um] LT", "sameDay":"LT", "sameElse":"L"}) }}',
  'timestamp.ThreadListItem':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Gestern]", "lastWeek":"dddd", "nextDay":"[Morgen]", "nextWeek":"dddd [um] LT", "sameDay":"LT", "sameElse":"L"}) }}',
  'timestamp.UserActivityStatus': 'Zuletzt gesehen {{ timestamp | fromNowFormatter }}',
};
