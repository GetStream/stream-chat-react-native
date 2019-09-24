# Changelog

## [0.2.6] 2019-09-23

- Fixing expo package for NetInfo changes

## [0.2.5] 2019-09-23

- Fixing deprecated warnings coming from NetInfo library
- Adding onMessageTouch and dismissKeyboardOnMessageTouch prop for MessageList component
- Fixing style issue (background color) of MessageText component, introduced in 0.2.4

## [0.2.4] 2019-09-13

- Fixing bug in theme logic
- Adding ability to customize more the MessageSimple component

## [0.2.3] 2019-09-09

- Fixing pagination issue when oldest message is not received yet

## [0.2.2] 2019-09-06

- Updated example two to react native 0.60
- Fixing UX for image/file picker - closing keyboard when you open file/image picker actionsheet

## [0.2.1] 2019-09-02

- Making sdk compatible with Expo 33 and 34

## [0.2.0] 2019-08-26

- Making sdk compatible with react native 0.60

## [0.1.19] 2019-08-26

- Updating ChannePreviewMessanger component to show other member's name as channel title if channel has no explicate name in channel.data

## [0.1.18] 2019-08-12

- Fixing keyboard compatible view for android. Status bar height was not taken into account while calculating the height of channel after opening keyboard.

## [0.1.17] 2019-08-08

- Fixing prop to override Attachment UI component

## [0.1.16] 2019-08-07

- Attachment for URL preview were broken. Fixed.

## [0.1.15] 2019-07-18

- Adding prop function `onChannelUpdated` as callback for event `channel.updated`
- Bug fix - Channel list component doesn't update when custom data on channel is updated.
