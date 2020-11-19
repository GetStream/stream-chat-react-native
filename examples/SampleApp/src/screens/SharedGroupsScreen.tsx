import React, { useEffect, useRef } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { Channel, UserResponse } from 'stream-chat';
import { Avatar } from '../../../../src/v2';
import { AppContext } from '../context/AppContext';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
} from '../types';

// const useSharedGroups = (user: UserResponse) => {
//   const [loading, setLoading] = useState(true);
//   const [sharedGroups, setSharedGroups] = useState<
//     Channel<
//       LocalAttachmentType,
//       LocalChannelType,
//       LocalCommandType,
//       LocalEventType,
//       LocalMessageType,
//       LocalResponseType,
//       LocalUserType
//     >[]
//   >([]);
//   const { chatClient } = useContext(AppContext);
//   const offset = useRef(0);
//   const hasMoreResults = useRef(true);
//   const queryInProgress = useRef(false);

//   const fetchGroups = async () => {
//     if (!chatClient?.user?.id) return;

//     if (queryInProgress.current) return;
//     setLoading(true);

//     try {
//       queryInProgress.current = true;

//       offset.current = offset.current + sharedGroups.length;

//       if (!hasMoreResults.current) {
//         queryInProgress.current = false;
//         return;
//       }

//       const newChannels = await chatClient?.queryChannels(
//         {
//           members: { $in: [chatClient.user?.id, user.id] },
//           type: 'messaging',
//         },
//         {
//           last_message_at: -1,
//         },
//         {
//           limit: 10,
//           offset: offset.current,
//         },
//       );

//       if (!newChannels) {
//         queryInProgress.current = false;
//         return;
//       }

//       setSharedGroups((existingGroups) => existingGroups.concat(newChannels));

//       if (newChannels.length < 10) {
//         hasMoreResults.current = false;
//       }
//     } catch (e) {
//       // do nothing;
//     }
//     queryInProgress.current = false;
//     setLoading(false);
//   };

//   const loadMore = () => {
//     fetchGroups();
//   };

//   useEffect(() => {
//     fetchGroups();
//   }, []);

//   /* eslint-disable sort-keys */
//   return {
//     loading,
//     loadMore,
//     sharedGroups,
//   };
// };

export const SharedGroupsScreen = ({
  route: {
    params: { user },
  },
}) => null;
