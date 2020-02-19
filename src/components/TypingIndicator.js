import React from 'react';

import { Avatar } from './Avatar';
import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';
import { withLocalizationContext } from '../context';
import {
  LSK_SINGLE_USER_TYPING,
  LSK_TWO_USERS_TYPING,
  LSK_MULTIPLE_USERS_TYPING,
} from '../locale';

const TypingText = styled.Text`
  margin-left: 10px;
  font-size: ${({ theme }) => theme.typingIndicator.text.fontSize}px;
  color: ${({ theme }) => theme.typingIndicator.text.color};
  ${({ theme }) => theme.typingIndicator.text.css};
`;

const Container = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

class TypingIndicator extends React.PureComponent {
  static themePath = 'typingIndicator';
  constructTypingString = (dict) => {
    const { localizedStrings } = this.props;
    const arr2 = Object.keys(dict);
    const arr3 = [];
    arr2.forEach((item, i) => {
      if (this.props.client.user.id === dict[arr2[i]].user.id) {
        return;
      }
      arr3.push(dict[arr2[i]].user.name || dict[arr2[i]].user.id);
    });
    let outStr = '';
    if (arr3.length === 1) {
      outStr = localizedStrings.formatString(
        localizedStrings[LSK_SINGLE_USER_TYPING],
        arr3[0],
      );
      dict;
    } else if (arr3.length === 2) {
      //joins all with "and" but =no commas
      //example: "bob and sam"
      outStr = localizedStrings.formatString(
        localizedStrings[LSK_TWO_USERS_TYPING],
        arr3[0],
        arr3[1],
      );
    } else if (arr3.length > 2) {
      //joins all with commas, but last one gets ", and" (oxford comma!)
      //example: "bob, joe, and sam"
      outStr = localizedStrings.formatString(
        localizedStrings[LSK_MULTIPLE_USERS_TYPING],
        arr3.slice(0, -1).join(', '),
        arr3.slice(-1),
      );
    }

    return outStr;
  };

  render() {
    const typing = Object.values(this.props.typing);

    return (
      <Container>
        {typing
          .filter(({ user }) => user.id !== this.props.client.user.id)
          .map(({ user }, idx) => (
            <Avatar
              image={user.image}
              size={24}
              name={user.name || user.id}
              key={user.id + idx}
            />
          ))}
        <TypingText>{this.constructTypingString(this.props.typing)}</TypingText>
      </Container>
    );
  }
}

const TypingIndicatorWithContext = withLocalizationContext(
  themed(TypingIndicator),
);
export { TypingIndicatorWithContext as TypingIndicator };
