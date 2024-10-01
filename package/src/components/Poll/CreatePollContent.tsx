import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  SafeAreaView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { CreatePollData, PollOptionData, VotingVisibility } from 'stream-chat';

import {
  CreatePollContentProvider,
  useChatContext,
  useCreatePollContentContext,
  useMessageInputContext,
} from '../../contexts';
import { DragHandle } from '../../icons';

type CurrentOptionPositionsCache = {
  inverseIndexCache: {
    [key: number]: number;
  };
  positionCache: {
    [key: number]: {
      updatedIndex: number;
      updatedTop: number;
    };
  };
};

const OPTION_HEIGHT = 69;
const getInitialPositions = (size: number): CurrentOptionPositionsCache => {
  const cache: CurrentOptionPositionsCache = { inverseIndexCache: {}, positionCache: {} };
  for (let i = 0; i < size; i++) {
    cache.positionCache[i] = {
      updatedIndex: i,
      updatedTop: i * OPTION_HEIGHT,
    };
    cache.inverseIndexCache[i] = i;
  }
  return cache;
};

const CreatePollOption = ({
  boundaries,
  currentOptionPositions,
  draggedItemId,
  handleChangeText,
  index,
  isDragging,
  option,
  reorderOptions,
}: {
  currentOptionPositions: SharedValue<CurrentOptionPositionsCache>;
  draggedItemId: SharedValue<number | null>;
  handleChangeText: (newText: string, index: number) => void;
  index: number;
  isDragging: SharedValue<1 | 0>;
  option: PollOptionData;
}) => {
  const top = useSharedValue(index * OPTION_HEIGHT);
  const isDraggingDerived = useDerivedValue(() => isDragging.value);

  const draggedItemIdDerived = useDerivedValue(() => draggedItemId.value);

  const isCurrentDraggingItem = useDerivedValue(
    () => isDraggingDerived.value && draggedItemIdDerived.value === index,
  );

  const animatedStyles = useAnimatedStyle(() => ({
    top: top.value,
    transform: [
      {
        scale: isCurrentDraggingItem.value
          ? interpolate(isDraggingDerived.value, [0, 1], [1, 1.025])
          : interpolate(isDraggingDerived.value, [0, 1], [1, 0.98]),
      },
    ],
  }));
  const currentOptionPositionsDerived = useDerivedValue<CurrentOptionPositionsCache>(
    () => currentOptionPositions.value,
  );

  //used for swapping with currentIndex
  const newIndex = useSharedValue<number | null>(null);

  //used for swapping with newIndex
  const currentIndex = useSharedValue<number | null>(null);

  const getKeyOfValue = (value: number, obj: CurrentOptionPositionsCache): number | undefined => {
    'worklet';
    for (const [key, val] of Object.entries(obj.positionCache)) {
      if (val.updatedIndex === value) {
        return Number(key);
      }
    }
    return undefined; // Return undefined if the value is not found
  };

  useAnimatedReaction(
    () => currentOptionPositionsDerived.value.positionCache[index].updatedIndex,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        top.value = withSpring(
          currentOptionPositionsDerived.value.positionCache[index].updatedIndex * OPTION_HEIGHT,
        );
      }
    },
  );

  const gesture = Gesture.Pan()
    .onStart(() => {
      // start dragging
      isDragging.value = withSpring(1);

      // keep track of dragged item
      draggedItemId.value = index;

      // store dragged item id for future swap
      currentIndex.value = currentOptionPositionsDerived.value.positionCache[index].updatedIndex;
    })
    .onUpdate((e) => {
      if (draggedItemIdDerived.value === null || currentIndex.value === null) {
        return;
      }
      const newTop =
        currentOptionPositionsDerived.value.positionCache[draggedItemIdDerived.value].updatedTop +
        e.translationY;
      // we add a small leeway to account for sharp animations which tend to bug out otherwise
      if (newTop < boundaries.minBound - 10 || newTop > boundaries.maxBound + 10) {
        // out of bounds, exit out of the animation early
        return;
      }
      top.value = newTop;

      // calculate the new index where drag is headed to
      newIndex.value = Math.floor((newTop + OPTION_HEIGHT / 2) / OPTION_HEIGHT);

      // swap the items present at newIndex and currentIndex
      if (newIndex.value !== currentIndex.value) {
        // find id of the item that currently resides at newIndex
        const newIndexItemKey = getKeyOfValue(newIndex.value, currentOptionPositionsDerived.value);

        // find id of the item that currently resides at currentIndex
        const currentDragIndexItemKey = getKeyOfValue(
          currentIndex.value,
          currentOptionPositionsDerived.value,
        );

        if (newIndexItemKey !== undefined && currentDragIndexItemKey !== undefined) {
          // we update updatedTop and updatedIndex as next time we want to do calculations from new top value and new index
          currentOptionPositions.value = {
            inverseIndexCache: {
              ...currentOptionPositionsDerived.value.inverseIndexCache,
              [newIndex.value]: currentDragIndexItemKey,
              [currentIndex.value]: newIndexItemKey,
            },
            positionCache: {
              ...currentOptionPositionsDerived.value.positionCache,
              [currentDragIndexItemKey]: {
                ...currentOptionPositionsDerived.value.positionCache[currentDragIndexItemKey],
                updatedIndex: newIndex.value,
              },
              [newIndexItemKey]: {
                ...currentOptionPositionsDerived.value.positionCache[newIndexItemKey],
                updatedIndex: currentIndex.value,
                updatedTop: currentIndex.value * OPTION_HEIGHT,
              },
            },
          };

          // update new index as current index
          currentIndex.value = newIndex.value;
        }
      }
    })
    .onEnd(() => {
      // stop dragging
      if (currentIndex.value === null || newIndex.value === null) {
        return;
      }

      top.value = withSpring(newIndex.value * OPTION_HEIGHT);

      // find original id of the item that currently resides at currentIndex
      const currentDragIndexItemKey = getKeyOfValue(
        currentIndex.value,
        currentOptionPositionsDerived.value,
      );

      if (currentDragIndexItemKey !== undefined) {
        // update the values for item whose drag we just stopped
        currentOptionPositions.value = {
          ...currentOptionPositionsDerived.value,
          positionCache: {
            ...currentOptionPositionsDerived.value.positionCache,
            [currentDragIndexItemKey]: {
              ...currentOptionPositionsDerived.value.positionCache[currentDragIndexItemKey],
              updatedTop: newIndex.value * OPTION_HEIGHT,
            },
          },
        };
      }
      //stop dragging
      isDragging.value = withDelay(200, withSpring(0));
      console.log(currentOptionPositionsDerived.value);
      runOnJS(reorderOptions)(currentOptionPositionsDerived.value.inverseIndexCache);
    });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: '100%',
        },
        animatedStyles,
      ]}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: '#F7F7F8',
          borderRadius: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingHorizontal: 16,
          paddingVertical: 18,
        }}
      >
        <TextInput
          multiline={true}
          onChangeText={(newText) => handleChangeText(newText, index)}
          placeholder='Option'
          style={{
            flex: 1,
            fontSize: 16,
          }}
          value={option.text}
        />
        <GestureDetector gesture={gesture}>
          <Animated.View>
            <DragHandle pathFill='#7E828B' />
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
};

const MemoizedCreatePollOption = React.memo(CreatePollOption);

export const CreatePollContentWithContext = () => {
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOptionData[]>([{ text: '1' }]);
  const [multipleAnswersAllowed, setMultipleAnswersAllowed] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [optionSuggestionsAllowed, setOptionSuggestionsAllowed] = useState(false);

  const { createAndSendPoll, handleClose } = useCreatePollContentContext();

  const pollOptionsRef = useRef(pollOptions);

  const updateOption = useCallback((newText: string, index: number) => {
    setPollOptions((prevOptions) =>
      prevOptions.map((option, idx) => (idx === index ? { ...option, text: newText } : option)),
    );
  }, []);

  const reorderOptions = useCallback(
    (lookupTable) => {
      const currentPollOptions = Object.assign({}, pollOptions);
      const newPollOptions = [];

      for (let i = 0; i < pollOptions.length; i++) {
        newPollOptions.push(currentPollOptions[lookupTable[i]]);
      }
      // actually setting the state messes the animations up a bit, so we update the ref and use that instead
      pollOptionsRef.current = newPollOptions;
    },
    [pollOptions],
  );

  useEffect(() => {
    pollOptionsRef.current = pollOptions;
  }, [pollOptions]);

  // positions lookup map
  const currentOptionPositions = useSharedValue<CurrentOptionPositionsCache>(
    getInitialPositions(pollOptions.length),
  );
  // used to know if drag is happening or not
  const isDragging = useSharedValue<0 | 1>(0);
  // this will hold id for item which user started dragging
  const draggedItemId = useSharedValue<number | null>(null);

  const boundaries = useMemo(
    () => ({ maxBound: (pollOptions.length - 1) * OPTION_HEIGHT, minBound: 0 }),
    [pollOptions],
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => handleClose()}>
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text>Create Poll</Text>
        <TouchableOpacity
          onPress={() =>
            createAndSendPoll({
              allow_user_suggested_options: optionSuggestionsAllowed,
              enforce_unique_vote: !multipleAnswersAllowed,
              name: pollTitle,
              options: pollOptionsRef.current,
              voting_visibility: isAnonymous ? VotingVisibility.anonymous : VotingVisibility.public,
            })
          }
        >
          <Text>SEND</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1, margin: 16 }}>
        <View>
          <Text style={{ fontSize: 16 }}>Questions</Text>
          <TextInput
            onChangeText={setPollTitle}
            placeholder='Ask a question'
            style={{
              backgroundColor: '#F7F7F8',
              borderRadius: 12,
              fontSize: 16,
              marginTop: 8,
              paddingHorizontal: 16,
              paddingVertical: 18,
            }}
            value={pollTitle}
          />
        </View>
        <View style={{ marginVertical: 16 }}>
          <Text style={{ fontSize: 16 }}>Options</Text>
          <View style={{ height: OPTION_HEIGHT * pollOptions.length }}>
            {pollOptions.map((option, index) => (
              <MemoizedCreatePollOption
                boundaries={boundaries}
                currentOptionPositions={currentOptionPositions}
                draggedItemId={draggedItemId}
                handleChangeText={updateOption}
                index={index}
                isDragging={isDragging}
                key={index}
                option={option}
                reorderOptions={reorderOptions}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={() => {
              const newIndex = pollOptions.length;
              currentOptionPositions.value = {
                inverseIndexCache: {
                  ...currentOptionPositions.value.inverseIndexCache,
                  [newIndex]: newIndex,
                },
                positionCache: {
                  ...currentOptionPositions.value.positionCache,
                  [newIndex]: {
                    updatedIndex: newIndex,
                    updatedTop: newIndex * OPTION_HEIGHT,
                  },
                },
              };
              setPollOptions([...pollOptions, { text: String(pollOptions.length + 1) }]);
            }}
            style={{
              backgroundColor: '#F7F7F8',
              borderRadius: 12,
              marginTop: 8,
              paddingHorizontal: 16,
              paddingVertical: 18,
            }}
          >
            <Text style={{ fontSize: 16 }}>Add an option</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#F7F7F8',
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 18,
          }}
        >
          <Text style={{ fontSize: 16 }}>Multiple answers</Text>
          <Switch
            onValueChange={() => setMultipleAnswersAllowed(!multipleAnswersAllowed)}
            value={multipleAnswersAllowed}
          />
        </View>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#F7F7F8',
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 18,
          }}
        >
          <Text style={{ fontSize: 16 }}>Anonymous poll</Text>
          <Switch onValueChange={() => setIsAnonymous(!isAnonymous)} value={isAnonymous} />
        </View>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#F7F7F8',
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 18,
          }}
        >
          <Text style={{ fontSize: 16 }}>Suggest an option</Text>
          <Switch
            onValueChange={() => setOptionSuggestionsAllowed(!optionSuggestionsAllowed)}
            value={optionSuggestionsAllowed}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export const CreatePollContent = (props: { handleClose: () => void }) => {
  const { handleClose } = props;
  const { sendMessage } = useMessageInputContext();
  const { client } = useChatContext();

  const createAndSendPoll = useCallback(
    async (pollData: CreatePollData) => {
      // TODO: replace with stateful name
      // const poll = await client.polls.createPoll(pollData);
      // console.log('CREATED POLL: ', poll.id);
      // await sendMessage({ customMessageData: { poll_id: poll.id as string } });
      console.log('ISE: SENDING: ', pollData.options);
      handleClose();
    },
    [client, sendMessage, handleClose],
  );

  return (
    <CreatePollContentProvider value={{ createAndSendPoll, handleClose }}>
      <CreatePollContentWithContext />
    </CreatePollContentProvider>
  );
};
