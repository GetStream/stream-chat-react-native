import type { TranslationDictionary } from 'stream-chat-react-native';

/**
 * Italian UI copy for the Stream Chat SDK.
 *
 * See ./de.ts for the annotated version — the two files are structured identically.
 *
 * Registered in ./index.ts. Dates need one extra step; see ./README.md.
 */
export const it: TranslationDictionary = {
  // Connection + screen-reader status
  'a11y.connection.connected.accessibilityLabel': 'Connesso',
  'a11y.connection.offline.accessibilityLabel': 'Offline',
  'a11y.connection.reconnecting.accessibilityLabel': 'Riconnessione',
  'a11y.newMessage.withUser.accessibilityLabel': 'Nuovo messaggio da {{user}}',
  'a11y.newMessages.withCount.accessibilityLabel': '{{count}} nuovi messaggi',

  // AI typing indicator
  'aiTypingIndicator.generating.label': 'Generando...',
  'aiTypingIndicator.thinking.label': 'Pensando...',

  // Attachments
  'attachment.gallery.doubleTapToOpen.accessibilityLabel': 'Tocca due volte per aprire',
  'attachment.gallery.image.accessibilityLabel': 'Immagine della galleria',
  'attachment.gallery.moreImages.label_one': '+{{count}}',
  'attachment.gallery.moreImages.label_other': '+{{count}}',
  'attachment.gallery.video.accessibilityLabel': 'Video della galleria',
  'attachment.giphy.onlyVisibleToYou.text': 'Visibile solo a te',
  'attachment.unsupported.title': 'Allegato non supportato',

  // Attachment picker
  'attachmentPicker.camera.denied.description': 'Non hai concesso l’accesso alla fotocamera',
  'attachmentPicker.camera.description': 'Scatta una foto e condividila',
  'attachmentPicker.camera.label': 'Apri fotocamera',
  'attachmentPicker.camera.videoOnly.description': 'Registra un video e condividilo',
  'attachmentPicker.commands.title': 'Comandi Istantanei',
  'attachmentPicker.files.description': 'Seleziona file da condividere',
  'attachmentPicker.files.label': 'Apri file',
  'attachmentPicker.image.deselect.accessibilityLabel': 'Deseleziona immagine',
  'attachmentPicker.image.select.accessibilityLabel': 'Seleziona immagine',
  'attachmentPicker.maxFiles.error': 'Numero massimo di file raggiunto',
  'attachmentPicker.openSettings.label': 'Cambia in Impostazioni',
  'attachmentPicker.photoLibrary.addMore.label': 'Aggiungi altri',
  'attachmentPicker.photoLibrary.denied.description':
    "Non hai concesso l'accesso alla libreria foto.",
  'attachmentPicker.poll.description': 'Crea un sondaggio e lascia che tutti votino',
  'attachmentPicker.poll.label': 'Crea sondaggio',
  'attachmentPicker.typeButton.camera.accessibilityLabel': 'Apri fotocamera',
  'attachmentPicker.typeButton.commands.accessibilityLabel': 'Apri comandi',
  'attachmentPicker.typeButton.files.accessibilityLabel': 'Apri selezione file',
  'attachmentPicker.typeButton.images.accessibilityLabel': 'Apri selezione foto',
  'attachmentPicker.typeButton.poll.accessibilityLabel': 'Apri creazione sondaggio',
  'attachmentPicker.typeButton.videoRecorder.accessibilityLabel': 'Apri videocamera',
  'attachmentPicker.video.deselect.accessibilityLabel': 'Deseleziona video',
  'attachmentPicker.video.select.accessibilityLabel': 'Seleziona video',

  // Audio player
  'audioPlayer.formatUnsupported.error':
    'Il formato della registrazione non è supportato e non può essere riprodotto',
  'audioPlayer.playbackFailed.error': 'Impossibile riprodurre la registrazione',
  'audioPlayer.seekUnsupported.error': 'Impossibile spostarsi nella registrazione',

  // Autocomplete (mentions, commands, emoji)
  'autoCompleteInput.mention.channel.description': 'Notifica tutti in questo canale',
  'autoCompleteInput.mention.here.description': 'Notifica tutti i membri online in questo canale',
  'autoCompleteInput.mention.role.description': 'Notifica tutti i membri {{ role }}',
  'autoCompleteInput.placeholder': 'Mandare un messaggio',
  'autoCompleteInput.slowMode.placeholder': 'Slowmode, attendi {{seconds}}s...',
  'autoCompleteInput.suggestions.commandsAvailable.accessibilityLabel':
    'Suggerimenti di comandi disponibili',
  'autoCompleteInput.suggestions.emojisAvailable.accessibilityLabel':
    'Suggerimenti di emoji disponibili',
  'autoCompleteInput.suggestions.mentionsAvailable.accessibilityLabel':
    'Suggerimenti di menzioni disponibili',

  // Avatars
  'avatar.accessibilityLabel': 'Avatar di {{name}}',
  'avatar.channel.direct.accessibilityLabel': 'Chat diretta con {{name}}',
  'avatar.channel.group.accessibilityLabel': 'Canale con {{count}} membri',

  // Channel screen, system messages and errors
  'channel.addMembersFailed.error': 'Impossibile aggiungere membri',
  'channel.archiveUpdateFailed.error':
    'Impossibile aggiornare lo stato di archiviazione del canale',
  'channel.archived.text': 'Canale archiviato',
  'channel.blockUserFailed.error': "Impossibile bloccare l'utente",
  'channel.deleteChat.confirm.text':
    'Sei sicuro di voler eliminare questa chat? Questa azione non può essere annullata.',
  'channel.deleteChat.label': 'Elimina chat',
  'channel.deleteChat.title': 'Elimina chat',
  'channel.deleteFailed.error': 'Impossibile eliminare il canale',
  'channel.deleteGroup.confirm.text':
    'Sei sicuro di voler eliminare questo gruppo? Questa azione non può essere annullata.',
  'channel.deleteGroup.label': 'Elimina gruppo',
  'channel.deleteGroup.title': 'Elimina gruppo',
  'channel.deleted.text': 'Canale eliminato',
  'channel.imageUpdateFailed.error': "Impossibile aggiornare l'immagine del canale",
  'channel.imageUpdated.text': 'Immagine del canale aggiornata',
  'channel.jumpToFirstUnreadFailed.error': 'Impossibile passare al primo messaggio non letto',
  'channel.leave.confirm.groupName.text': 'il gruppo',
  'channel.leave.confirm.label': 'Esci',
  'channel.leave.confirm.text':
    'Non riceverai più messaggi da {{ name }}. Puoi rientrare in qualsiasi momento.',
  'channel.leaveChat.label': 'Lascia chat',
  'channel.leaveFailed.error': 'Impossibile lasciare il canale',
  'channel.leaveGroup.label': 'Lascia gruppo',
  'channel.left.text': 'Canale lasciato',
  'channel.membersAdded.text_one': '{{count}} membro aggiunto',
  'channel.membersAdded.text_other': '{{count}} membri aggiunti',
  'channel.membersRemoved.text_one': '{{count}} membro rimosso',
  'channel.membersRemoved.text_other': '{{count}} membri rimossi',
  'channel.muteChat.label': 'Disattiva audio chat',
  'channel.muteGroup.label': 'Disattiva audio gruppo',
  'channel.muteUpdateFailed.error': 'Impossibile aggiornare lo stato di silenziamento del canale',
  'channel.muted.text': 'Canale silenziato',
  'channel.nameUpdateFailed.error': 'Impossibile aggiornare il nome del canale',
  'channel.nameUpdated.text': 'Nome del canale aggiornato',
  'channel.noneSelected.text': 'Seleziona un canale',
  'channel.pinChat.label': 'Fissa chat',
  'channel.pinGroup.label': 'Fissa gruppo',
  'channel.pinUpdateFailed.error': 'Impossibile aggiornare lo stato di fissaggio del canale',
  'channel.pinned.text': 'Canale fissato',
  'channel.removeMembersFailed.error': 'Impossibile rimuovere i membri',
  'channel.removeUser.confirm.label': 'Rimuovi',
  'channel.removeUser.confirm.text': 'Sei sicuro di voler rimuovere questo membro dal canale?',
  'channel.removeUser.label': 'Rimuovi utente',
  'channel.unarchived.text': "Canale rimosso dall'archivio",
  'channel.unmuteChat.label': 'Riattiva audio chat',
  'channel.unmuteGroup.label': 'Riattiva audio gruppo',
  'channel.unmuted.text': 'Canale non più silenziato',
  'channel.unpinChat.label': 'Sfissa chat',
  'channel.unpinGroup.label': 'Sfissa gruppo',
  'channel.unpinned.text': 'Canale non più fissato',
  'channel.userBlocked.text': 'Utente bloccato',
  'channel.userUnblocked.text': 'Utente sbloccato',

  // Channel details screen
  'channelDetails.addMembers.accessibilityLabel': 'Aggiungi membri',
  'channelDetails.addMembers.alreadyMember.accessibilityLabel': '{{name}} è già un membro',
  'channelDetails.addMembers.alreadyMember.text': 'Già membro',
  'channelDetails.addMembers.confirm.accessibilityLabel': 'Conferma aggiunta membri',
  'channelDetails.addMembers.label': 'Aggiungi',
  'channelDetails.addMembers.load.error': 'Impossibile caricare gli utenti',
  'channelDetails.addMembers.noUserFound.label': 'Nessun utente trovato',
  'channelDetails.addMembers.search.accessibilityLabel': 'Cerca utenti da aggiungere',
  'channelDetails.addMembers.selectUser.accessibilityLabel': 'Seleziona {{name}}',
  'channelDetails.addMembers.title': 'Aggiungi membri',
  'channelDetails.editChannel.accessibilityLabel': 'Modifica canale',
  'channelDetails.editChannel.confirm.accessibilityLabel': 'Conferma modifica del canale',
  'channelDetails.editChannel.label': 'Modifica',
  'channelDetails.editChannel.name.accessibilityLabel': 'Nome del canale',
  'channelDetails.editChannel.name.placeholder': 'Nome del canale',
  'channelDetails.editChannel.upload.accessibilityLabel': 'Carica immagine del canale',
  'channelDetails.editChannel.upload.label': 'Carica',
  'channelDetails.editImageSheet.chooseImage.label': 'Scegli immagine',
  'channelDetails.editImageSheet.close.accessibilityLabel':
    'Chiudi il pannello di modifica immagine',
  'channelDetails.editImageSheet.resetPicture.label': 'Reimposta immagine',
  'channelDetails.editImageSheet.takePhoto.label': 'Scatta foto',
  'channelDetails.editImageSheet.title': 'Modifica immagine del gruppo',
  'channelDetails.fileAttachmentList.empty.description': 'Condividi un file per vederlo qui',
  'channelDetails.fileAttachmentList.empty.title': 'Nessun file',
  'channelDetails.fileAttachmentList.load.error': 'Caricamento dei file non riuscito',
  'channelDetails.header.back.accessibilityLabel': 'Indietro',
  'channelDetails.header.contactInfo.title': 'Informazioni di contatto',
  'channelDetails.header.groupInfo.title': 'Informazioni del gruppo',
  'channelDetails.mediaList.empty.description': 'Condividi una foto o un video per vederlo qui',
  'channelDetails.mediaList.empty.title': 'Nessuna foto o video',
  'channelDetails.mediaList.load.error': 'Caricamento dei file multimediali non riuscito',
  'channelDetails.memberList.load.error': 'Impossibile caricare i membri',
  'channelDetails.memberList.noMembersFound.label': 'Nessun membro trovato',
  'channelDetails.memberList.search.accessibilityLabel': 'Cerca membri',
  'channelDetails.memberRoles.admin.label': 'Amministratore',
  'channelDetails.memberRoles.moderator.label': 'Moderatore',
  'channelDetails.memberRoles.owner.label': 'Proprietario',
  'channelDetails.memberSection.title_one': '{{count}} membro',
  'channelDetails.memberSection.title_other': '{{count}} membri',
  'channelDetails.memberSection.viewAll.label': 'Vedi tutto',
  'channelDetails.muted.accessibilityLabel': 'Silenziato',
  'channelDetails.navigation.files.label': 'File',
  'channelDetails.navigation.photosAndVideos.label': 'Foto e video',
  'channelDetails.navigation.pinnedMessages.label': 'Messaggi in evidenza',
  'channelDetails.pinnedMessageList.empty.description':
    'Tieni premuto un messaggio per fissarlo nella chat',
  'channelDetails.pinnedMessageList.empty.title': 'Nessun messaggio in evidenza',
  'channelDetails.pinnedMessageList.load.error': 'Impossibile caricare i messaggi fissati',
  'channelDetails.pinnedMessageList.search.accessibilityLabel': 'Cerca messaggi in evidenza',
  'channelDetails.presence.membersOnline.label_one':
    '{{memberCount}} membro, {{onlineCount}} online',
  'channelDetails.presence.membersOnline.label_other':
    '{{memberCount}} membri, {{onlineCount}} online',

  // Channel list
  'channelList.header.loadFailed.error':
    'Errore durante il caricamento, per favore ricarica la pagina',

  // Channel list row
  'channelPreview.deliveryStatus.delivered.accessibilityLabel': 'Consegnato, inviato da te',
  'channelPreview.deliveryStatus.read.accessibilityLabel': 'Letto, inviato da te',
  'channelPreview.deliveryStatus.sent.accessibilityLabel': 'Inviato da te',
  'channelPreview.displayName.others.label': 'e {{ count }} altri',
  'channelPreview.lastMessage.accessibilityLabel': 'Ultimo messaggio {{date}}',
  'channelPreview.messageFailed.error': 'Il messaggio non è stato inviato',
  'channelPreview.muted.accessibilityLabel': 'Silenziato',
  'channelPreview.noMessages.text': 'Ancora nessun messaggio',
  'channelPreview.pinned.accessibilityLabel': 'Fissato',
  'channelPreview.pollVote.byYou.label': 'Hai votato: {{ option }}',
  'channelPreview.pollVote.withUser.label': '{{ user }} ha votato: {{ option }}',
  'channelPreview.typing.label': 'Scrivendo',
  'channelPreview.typing.withTwoUsers.label': '{{ firstUser }} e {{ secondUser }} stanno scrivendo',
  'channelPreview.typing.withUser.label': '{{ user }} sta scrivendo',
  'channelPreview.typing.withUserCount.label': '{{ numberOfUsers }} persone stanno scrivendo',
  'channelPreview.unreadCount.accessibilityLabel': '{{count}} messaggi non letti',

  // Shared labels reused across screens
  'common.anonymousUser.label': 'Anonimo',
  'common.cameraPermission.text':
    'La fotocamera del dispositivo viene utilizzata per scattare foto o video.',
  'common.cameraPermission.title':
    "Consenti l'accesso alla fotocamera nelle impostazioni del dispositivo",
  'common.cancel.label': 'Annulla',
  'common.close.accessibilityLabel': 'Chiudi',
  'common.draft.label': 'Bozza',
  'common.editMessageFailed.error': 'Richiesta di modifica del messaggio non riuscita',
  'common.galleryPermission.text':
    'Le autorizzazioni della galleria del dispositivo vengono utilizzate per scattare foto o video.',
  'common.galleryPermission.title': "Consenti l'accesso alla tua galleria",
  'common.linksDisabled.text': "L'invio di link non è consentito in questa conversazione",
  'common.linksDisabled.title': 'I link sono disabilitati',
  'common.loading.text': 'Caricamento...',
  'common.messageOverlay.swipeHint.accessibilityLabel':
    'Scorri a destra per passare in rassegna le diverse azioni',
  'common.openSettings.label': 'Apri Impostazioni',
  'common.presence.offline.label': 'Offline',
  'common.presence.online.label': 'Online',
  'common.reconnecting.text': 'Ricollegarsi...',
  'common.sendMessageFailed.error': 'Richiesta di invio del messaggio non riuscita',
  'common.unknownUser.label': 'Utente sconosciuto',
  'common.you.label': 'Tu',

  // Image gallery
  'imageGallery.footer.grid.accessibilityLabel': 'Icona griglia',
  'imageGallery.footer.position.text': '{{ index }} di {{ photoLength }}',
  'imageGallery.footer.share.accessibilityLabel': 'Pulsante condividi',
  'imageGallery.header.hideOverlay.accessibilityLabel': 'Nascondi sovrapposizione',
  'imageGallery.position.accessibilityLabel': '{{position}} di {{count}}',
  'imageGallery.videoControl.playPause.accessibilityLabel': 'Pulsante riproduci/pausa',

  // Empty / loading / error states
  'indicators.emptyState.noChats.text': 'Non ci sono ancora chat qui...',
  'indicators.emptyState.noConversations.text': 'Ancora nessuna conversazione',
  'indicators.emptyState.noItems.text': 'Nessun elemento',
  'indicators.emptyState.noThreads.text': 'Rispondi a un messaggio per iniziare un thread',
  'indicators.loading.channels.error': 'Errore durante il caricamento della lista dei canali...',
  'indicators.loading.channels.text': 'Caricamento canali in corso...',
  'indicators.loading.error': 'Errore di caricamento',
  'indicators.loading.messages.error':
    'Errore durante il caricamento dei messaggi per questo canale...',
  'indicators.loading.messages.text': 'Caricamento messaggi...',

  // Message bubble, actions and status
  'message.banUser.label': 'Blocca Utente',
  'message.blockUser.label': 'Blocca Utente',
  'message.blockUserConfirm.label': 'Blocca',
  'message.blockUserConfirm.text':
    'Non potrà inviarti messaggi né chiamarti. Potrai sbloccarlo in seguito.',
  'message.blockUserConfirm.title': 'Blocca {{ name }}',
  'message.bounce.sendAnyway.label': 'Invia comunque',
  'message.bounce.text':
    'Considera come il tuo commento potrebbe far sentire gli altri e assicurati di seguire le nostre Linee guida della community',
  'message.bounce.title': 'Sei sicuro?',
  'message.content.contextMenuHint.accessibilityLabel':
    'Tocca due volte e tieni premuto per attivare il menu contestuale',
  'message.content.fromSender.accessibilityLabel': 'Messaggio da {{sender}}',
  'message.content.fromYou.accessibilityLabel': 'Messaggio da te',
  'message.copied.text': 'Messaggio copiato negli appunti',
  'message.copyMessage.error': 'Impossibile copiare il messaggio',
  'message.copyMessage.label': 'Copia Messaggio',
  'message.deleteForMe.label': 'Elimina per me',
  'message.deleteMessage.error': "Errore durante l'eliminazione del messaggio",
  'message.deleteMessage.label': 'Cancella il Messaggio',
  'message.deleteMessageConfirm.label': 'Elimina',
  'message.deleteMessageConfirm.text':
    'Sei sicuro di voler eliminare definitivamente questo messaggio?',
  'message.deleted.text': 'Messaggio cancellato',
  'message.editMessage.label': 'Modifica Messaggio',
  'message.edited.text': 'Modificato',
  'message.flagMessage.error': 'Errore durante la segnalazione del messaggio',
  'message.flagMessage.label': 'Contrassegna Messaggio',
  'message.flagMessageConfirm.label': 'Contrassegna',
  'message.flagMessageConfirm.text':
    'Vuoi inviare una copia di questo messaggio a un moderatore per ulteriori indagini?',
  'message.flagged.text': 'Messaggio segnalato con successo',
  'message.markUnread.label': 'Segna come non letto',
  'message.markUnreadTooOld.error':
    'Errore durante il contrassegno del messaggio come non letto. Non è possibile contrassegnare i messaggi non letti più vecchi dei 100 messaggi più recenti del canale.',
  'message.markedUnread.text': 'Messaggio contrassegnato come non letto',
  'message.muteUser.error': 'Errore durante il silenziamento di un utente ...',
  'message.muteUser.label': 'Utente Muto',
  'message.pinMessage.error': 'Errore durante il fissaggio del messaggio',
  'message.pinMessage.label': 'Metti in evidenza',
  'message.pinned.text': 'Messaggio fissato',
  'message.pinnedBy.text': 'Fissato da',
  'message.reactionList.more.accessibilityLabel': 'e altre {{count}} reazioni',
  'message.reactionList.viewHint.accessibilityLabel': 'Tocca due volte per vedere le reazioni',
  'message.reactionList.youReacted.accessibilityLabel': 'hai reagito',
  'message.reminderOverdue.text': 'Promemoria scaduto',
  'message.reminderSet.text': 'Promemoria impostato',
  'message.replies.many.label': '{{ replyCount }} Risposte',
  'message.replies.one.label': '1 Risposta',
  'message.replies.viewHint.accessibilityLabel': 'Tocca due volte per vedere il thread',
  'message.reply.label': 'Rispondi',
  'message.resend.label': 'Invia di nuovo',
  'message.savedForLater.text': 'Salvato per dopo',
  'message.sentToChannelHeader.alsoSent.text': 'Inviato anche nel canale',
  'message.sentToChannelHeader.repliedToThread.text': 'Ha risposto a un thread',
  'message.sentToChannelHeader.view.label': 'Vedi',
  'message.status.delivered.accessibilityLabel': 'Consegnato',
  'message.status.read.accessibilityLabel': 'Letto',
  'message.status.sending.accessibilityLabel': 'Invio in corso',
  'message.status.sent.accessibilityLabel': 'Inviato',
  'message.threadReply.label': 'Rispondi alla Discussione',
  'message.unbanUser.label': 'Sblocca Utente',
  'message.unblockUser.label': 'Sblocca utente',
  'message.unmuteUser.error': 'Errore durante la rimozione del silenziamento di un utente ...',
  'message.unmuteUser.label': 'Riattiva utente',
  'message.unpinMessage.error': 'Errore durante la rimozione del pin dal messaggio',
  'message.unpinMessage.label': 'Rimuovi dagli elementi in evidenza',
  'message.unpinned.text': 'Messaggio non più fissato',
  'message.userMuted.text': '{{ user }} è stato silenziato',
  'message.userUnmuted.text': '{{ user }} non è più silenziato',

  // Message input and voice recorder
  'messageInput.addAttachment.accessibilityLabel': 'Aggiungi allegato',
  'messageInput.alsoSendToChannel.label': 'Invia anche al canale',
  'messageInput.attachmentUpload.network.error': 'Errore di rete',
  'messageInput.attachmentUpload.notSupported.error': 'non supportato',
  'messageInput.attachmentUpload.retry.label': 'Riprova caricamento',
  'messageInput.attachmentUpload.tooLarge.error': 'File troppo grande',
  'messageInput.audioRecorder.delete.accessibilityLabel': 'Elimina registrazione vocale',
  'messageInput.audioRecorder.holdToRecord.text':
    'Tieni premuto per registrare. Rilascia per salvare.',
  'messageInput.audioRecorder.permissionDenied.text':
    'Si prega di consentire le autorizzazioni audio nelle impostazioni.',
  'messageInput.audioRecorder.recordingDeleted.text': 'Messaggio vocale eliminato',
  'messageInput.audioRecorder.send.accessibilityLabel': 'Invia registrazione vocale',
  'messageInput.audioRecorder.slideToCancel.text': 'Scorri per annullare',
  'messageInput.audioRecorder.start.accessibilityLabel': 'Avvia registrazione vocale',
  'messageInput.audioRecorder.stop.accessibilityLabel': 'Interrompi registrazione vocale',
  'messageInput.closeAttachments.accessibilityLabel': 'Chiudi allegati',
  'messageInput.removeAttachment.accessibilityLabel': 'Rimuovi allegato',
  'messageInput.saveEdit.accessibilityLabel': 'Salva messaggio modificato',
  'messageInput.sendMessage.accessibilityLabel': 'Invia messaggio',
  'messageInput.sendMessageDisallowed.text': 'Non puoi inviare messaggi in questo canale',

  // Message list
  'messageList.dismissUnread.accessibilityLabel': 'Ignora i messaggi non letti',
  'messageList.newMessages.text': '{{count}} nuovi messaggi',
  'messageList.scrollToBottom.accessibilityLabel': 'Vai in fondo',
  'messageList.scrollToBottom.withCount.accessibilityLabel':
    'Vai in fondo, {{count}} nuovi messaggi',
  'messageList.typing.withMoreUsers.label':
    '{{ firstUser }} e altri {{ nonSelfUserLength }} stanno scrivendo',
  'messageList.unreadMessages.label': 'Messaggi non letti',
  'messageList.unreadMessages.withCount.label': '{{count}} non letti',

  // Message action menu
  'messageMenu.actionList.accessibilityLabel': 'Azioni del messaggio',
  'messageMenu.reactionPicker.moreReactions.accessibilityLabel': 'Apri altre reazioni',
  'messageMenu.userReactions.fetchFailed.error': 'Errore durante il recupero delle reazioni',
  'messageMenu.userReactions.tapToRemove.description': 'Tocca per rimuovere',
  'messageMenu.userReactions.title_one': '{{count}} reazione',
  'messageMenu.userReactions.title_other': '{{count}} reazioni',

  // Message preview (channel list + threads)
  'messagePreview.audio.label': 'Audio',
  'messagePreview.audios.label_one': '{{count}} audio',
  'messagePreview.audios.label_other': '{{count}} audio',
  'messagePreview.files.label_one': '{{count}} file',
  'messagePreview.files.label_other': '{{count}} file',
  'messagePreview.giphy.label': 'Giphy',
  'messagePreview.liveLocation.label': 'Posizione in tempo reale',
  'messagePreview.location.label': 'Posizione',
  'messagePreview.photo.label': 'Foto',
  'messagePreview.photos.label_one': '{{count}} foto',
  'messagePreview.photos.label_other': '{{count}} foto',
  'messagePreview.video.label': 'Video',
  'messagePreview.videos.label_one': '{{count}} video',
  'messagePreview.videos.label_other': '{{count}} video',
  'messagePreview.voiceMessage.label': 'Messaggio vocale ({{duration}})',
  'messagePreview.voiceMessages.label_one': '{{count}} messaggio vocale',
  'messagePreview.voiceMessages.label_other': '{{count}} messaggi vocali',

  // Toasts and inline notifications
  'notifications.attachmentFileMissing.error': 'È necessario un file per caricare un allegato',
  'notifications.attachmentIdMissing.error': "ID locale mancante per l'allegato locale da caricare",
  'notifications.attachmentUploadBlocked.error':
    "Caricamento dell'allegato bloccato a causa di {{reason}}",
  'notifications.attachmentUploadBlocked.reason.sizeLimit.text': 'limite di dimensione',
  'notifications.attachmentUploadBlocked.reason.unknownError.text': 'errore sconosciuto',
  'notifications.attachmentUploadBlocked.reason.unsupportedFileType.text':
    'tipo di file non supportato',
  'notifications.attachmentUploadFailed.error': "Errore durante il caricamento dell'allegato",
  'notifications.attachmentUploadFailed.withReason.error':
    "Caricamento dell'allegato non riuscito a causa di {{reason}}",
  'notifications.attachmentUploadInProgress.error': 'Attendi il caricamento di tutti gli allegati',
  'notifications.commandUnavailable.error': 'Comando non disponibile',
  'notifications.commandUnavailable.whileEditing.error':
    'Comando non disponibile durante la modifica',
  'notifications.commandUnavailable.whileReplying.error':
    'Comando non disponibile durante la risposta',
  'notifications.dismiss.accessibilityLabel': 'Chiudi notifica',
  'notifications.list.accessibilityLabel': 'Notifiche',
  'notifications.locationRetrieveFailed.error': 'Impossibile recuperare la posizione',
  'notifications.locationShareFailed.error': 'Impossibile condividere la posizione',
  'notifications.pollCreateFailed.error': 'Impossibile creare il sondaggio',
  'notifications.pollCreateFailed.withReason.error':
    'Impossibile creare il sondaggio a causa di {{reason}}',
  'notifications.pollEndFailed.withReason.error':
    'Impossibile terminare il sondaggio a causa di {{reason}}',
  'notifications.pollEnded.text': 'Sondaggio terminato',
  'notifications.recordingPlaybackFailed.error':
    'Errore durante la riproduzione della registrazione',
  'notifications.threadNotFound.error': 'Thread non trovato',
  'notifications.voteLimitReached.error':
    'Limite di voti raggiunto. Rimuovi prima un voto esistente.',

  // Polls
  'poll.addComment.description': 'Aggiungi un commento al sondaggio',
  'poll.addComment.label': 'Aggiungi un commento',
  'poll.addComment.placeholder': 'Il tuo commento',
  'poll.allOptions.title': 'Opzioni del sondaggio',
  'poll.comments.title': 'Commenti sul sondaggio',
  'poll.createPoll.anonymousVoting.description': 'Nascondi chi ha votato',
  'poll.createPoll.anonymousVoting.label': 'Sondaggio anonimo',
  'poll.createPoll.close.accessibilityLabel': 'Chiudi creazione sondaggio',
  'poll.createPoll.maxVotes.decrease.accessibilityLabel': 'Riduci il numero massimo di voti',
  'poll.createPoll.maxVotes.description': 'Scegli tra 2 e 10 opzioni',
  'poll.createPoll.maxVotes.increase.accessibilityLabel': 'Aumenta il numero massimo di voti',
  'poll.createPoll.maxVotes.label': 'Limita i voti per persona',
  'poll.createPoll.maxVotes.range.error': 'Inserisci un numero da 2 a 10',
  'poll.createPoll.multipleVotes.description': "Seleziona più di un'opzione",
  'poll.createPoll.multipleVotes.label': 'Voti multipli',
  'poll.createPoll.options.duplicate.error': "L'opzione esiste già",
  'poll.createPoll.options.label': 'Opzioni',
  'poll.createPoll.options.placeholder': "Aggiungi un'opzione",
  'poll.createPoll.question.label': 'Domande',
  'poll.createPoll.question.placeholder': 'Fai una domanda',
  'poll.createPoll.submit.accessibilityLabel': 'Crea sondaggio',
  'poll.endVote.error': 'Impossibile terminare il sondaggio',
  'poll.endVote.label': 'Termina votazione',
  'poll.inputDialog.send.label': 'Invia',
  'poll.modalHeader.close.accessibilityLabel': 'Chiudi sondaggio',
  'poll.moreOptions.label_one': '+{{count}} altra opzione',
  'poll.moreOptions.label_other': '+{{count}} altre opzioni',
  'poll.question.label': 'Domanda',
  'poll.results.optionNumber.text': 'Opzione {{count}}',
  'poll.results.showAll.label': 'Mostra tutto',
  'poll.results.title': 'Risultati del sondaggio',
  'poll.subtitle.ended.text': 'Votazione terminata',
  'poll.subtitle.selectAny.text': 'Seleziona una o più',
  'poll.subtitle.selectOne.text': 'Seleziona una',
  'poll.subtitle.selectUpTo.text_one': 'Seleziona fino a {{count}}',
  'poll.subtitle.selectUpTo.text_other': 'Seleziona fino a {{count}}',
  'poll.suggestOption.description': 'Permetti ad altri di aggiungere opzioni',
  'poll.suggestOption.label': "Suggerisci un'opzione",
  'poll.suggestOption.placeholder': 'Inserisci una nuova opzione',
  'poll.updateComment.label': 'Aggiorna il tuo commento',
  'poll.viewComments.label_one': 'Vedi {{count}} commento',
  'poll.viewComments.label_other': 'Vedi {{count}} commenti',
  'poll.viewResults.label': 'Visualizza i risultati',
  'poll.votes.text_one': '{{count}} voto',
  'poll.votes.text_other': '{{count}} voti',
  'poll.votes.title': 'Voti',

  // Quoted replies
  'reply.editingMessage.accessibilityLabel': 'Modifica del messaggio',
  'reply.editingMessage.withText.accessibilityLabel': 'Modifica del messaggio: {{text}}',
  'reply.removeEdit.accessibilityLabel': 'Rimuovi modifica',
  'reply.removeReply.accessibilityLabel': 'Rimuovi risposta',
  'reply.replyTo.title': 'Rispondi a {{name}}',
  'reply.replying.withUser.accessibilityLabel': 'Rispondendo a {{user}}',
  'reply.replying.withUserAndText.accessibilityLabel': 'Rispondendo a {{user}}: {{text}}',

  // Thread list
  'threadList.unreadBanner.loadFailed.error':
    'Impossibile caricare nuovi thread. Tocca per riprovare',
  'threadList.unreadBanner.newThreads.label': '{{count}} nuovi thread',

  // Shared UI primitives
  'uiComponents.bottomSheetModal.opened.accessibilityLabel':
    "Pannello inferiore aperto. Attiva l'azione di chiusura o usa il gesto di uscita per chiuderlo.",
  'uiComponents.searchInput.clear.accessibilityLabel': 'Cancella ricerca',
  'uiComponents.searchInput.placeholder': 'Cerca',

  // Dates and times — see the note in README.md
  'timestamp.ChannelPreviewStatus':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Ieri]", "lastWeek":"dddd", "nextDay":"[Domani]", "nextWeek":"dddd [alle] LT", "sameDay":"LT", "sameElse":"L"}) }}',
  'timestamp.ThreadListItem':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Ieri]", "lastWeek":"dddd", "nextDay":"[Domani]", "nextWeek":"dddd [alle] LT", "sameDay":"LT", "sameElse":"L"}) }}',
  'timestamp.UserActivityStatus': 'Ultimo accesso {{ timestamp | fromNowFormatter }}',
};
