# JavaScript CodeStyle

In an effort to have consistent READABLE code across our various JavaScript libraries these coding rules should be followed. This will make it easier for clients/new hires/other developers to read any of our code as it will be written in a single format

---

## General Provisions

Follow the linting (eslint/prettier) rules setup for each library which should mostly be the same and auto-format on file save or pre-commit hook

---

## Additional guidelines that the linters will not cover 

### __Naming__

Self-documenting code is the ideal we want to have so semantic naming should be as descriptive as necessary and consistent. The only exception is the indexing variable in an loop. That can be shortened to a single letter starting from `i`. For an absolute global `const` such as milliseconds in a day use all-caps with words separated by an underscore `_`.

- variableNamesLikeThis
- methodNamesLikeThis
- ClassNamesLikeThis
- ComponentsLikeThis
- `const DAY_IN_MILLISECONDS = 86400000;`

### __Spacing__

Let the code breathe instead of cramming it into as tiny of a space as possible as readability is more important. For example: if there is a file with numerous hooks being used in a row and then a final return, let them all be spaced out and own an individual piece of real estate on your screen instead of being shoved all together. Keep your covid distance or give your dog a little yard to run around in as 🏠-🏠-🏠-🏠-🏠 is better than 🏠🏠🏠🏠🏠

### __Exports__

Use one or multiple `export const` or `export type` and never `export default`

### __Imports__

- Imports not from third-party libraries should always be to the absolute path of the desired file and not a shared `index` file within a directory
- Imports should also be ordered by types (non-type-only imports first) then depth and then alphabetically (case-insensitive). Exceptions are:
    - if a 3rd party library requires being the first import
    - if within a React file `import React from 'react';` should always be first
    - if within a React Native file `import {} from 'react-native';` goes after the previous exception before all other alphabetical imports
    
_Example:_

```tsx
    import React, { PropsWithChildren, useEffect, useState } from 'react';
    import { Platform } from 'react-native';
    import Dayjs from 'dayjs';

    import { useCreateChatContext } from './hooks/useCreateChatContext';
    import { useIsOnline } from './hooks/useIsOnline';

    import {
        ChatContextValue,
        ChatProvider,
    } from '../../contexts/chatContext/ChatContext';
    import { useOverlayContext } from '../../contexts/overlayContext/OverlayContext';
    import {
        DeepPartial,
        ThemeProvider,
    } from '../../contexts/themeContext/ThemeContext';
    import {
        TranslationContextValue,
        TranslationProvider,
    } from '../../contexts/translationContext/TranslationContext';
    import { useStreami18n } from '../../utils/useStreami18n';

    import type { Channel } from 'stream-chat';

    import type { Theme } from '../../contexts/themeContext/utils/theme';
    import type { Streami18n } from '../../utils/Streami18n';
    import type {
        DefaultAttachmentType,
        DefaultChannelType,
        DefaultCommandType,
        DefaultEventType,
        DefaultMessageType,
        DefaultReactionType,
        DefaultUserType,
        UnknownType,
    } from '../../types/types';
```

### __Destructure Props__

If more than __1__ prop is being used within a method, it should be passed in as `props` and then destructured on the first line of the body.

_Example single prop:_

```tsx
export const EmptyStateIndicator: React.FC<EmptyStateProps> = ({
  listType,
}) => {
  ...
};
```

_Example multiple props:_

```tsx
export const Avatar: React.FC<AvatarProps> = (props) => {
  const {
    containerStyle,
    image: imageProp,
    imageStyle,
    name,
    online,
    presenceIndicator: presenceIndicatorProp,
    presenceIndicatorContainerStyle,
    size,
    testID,
  } = props;
  ...
};
```

### __Variable Declaration__

Do not use `var`. Use `const` and avoid using `let` unless a creative solution cannot be implemented.

Bad:

```tsx
let extra = attachment?.actions?.length ? 'actions' : '';
if (
    componentType === 'card' &&
    !attachment.image_url &&
    !attachment.thumb_url
) {
    extra = 'no-image';
}
```

Good:

```tsx
const extra =
    componentType === 'card' && !attachment?.image_url && !attachment?.thumb_url
      ? 'no-image'
      : attachment?.actions?.length
      ? 'actions'
      : '';
```

### __Magic Numbers__

Avoid using magic numbers in code and instead create a searchable variable name for them

Good:

```tsx
const DAY_IN_MILLISECONDS = 86400000;

setTimeout(doSomething, DAY_IN_MILLISECONDS);
```

Bad:

```tsx
setTimeout(doSomething, 86400000);
```

### __Comments__

Always use multiline comments instead of single line comments

_Multiline Good:_

```tsx
/** Comment */
```

_Single Line Bad:_

```tsx
// Comment
```

### TypeScript issues

If there is a TypeScript issue which cannot be resolved because it is coming from another library or will be fixed in the future, utilize the annotation `@ts-expect-error` instead of `@ts-ignore` as this will inform us when the TypeScript issue is resolved and not be left stale in the code

### __Literals__

#### __Objects__

- Object should always be created by `{}` and not `new Object()`
- When creating an empty Object, use `{}` without spaces
- When using an Object with keys
   - Keys should be sorted alphabetically (case-insensitive) as this is a logical way to read a list
   - If this is a type declaration, required types should appear alphabetically before optional types

Good:

```tsx
const obj = { A: 1, b: 2, C: 3 };

const obj = {
    A: 1,
    b: 2,
    C: 3,
};

type Type = {
    requiredTypeOne: string;
    requiredTypeTwo: number;
    optionalTypeOne?: string;
    optionalTypeTwo?: number;
};
```

Bad:
```tsx
const obj = {A:1,b:2,C:3};

const obj = {A:1, b:2, C:3};

const obj = {A : 1, b : 2, C : 3};

const obj = { "A" : 1, "b" : 2, "C" : 3 };

const obj = { A : 1, b : 2, C : 3 };

const obj = { A :1, b :2, C :3 };

const obj = { A : 1 , b : 2 , C : 3 };

const obj = {
    A : 1,
    b : 2,
    C : 3,
};


const obj = {
    A : 1
  , b : 2
  , C : 3
};

type Type = {
    optionalTypeOne?: string;
    requiredTypeOne: string;
    optionalTypeTwo?: number;
    requiredTypeTwo: number;
};
```

#### __Arrays__

- Arrays should always be created by `[]` and not `new Array()`.
- When creating an empty Array, use `[]` without spaces.
- When creating an Array with values
   - The comma should have no space before and 1 space behind itself
   - The last value shouldn't be trailed with a comma on a single line but should on a multiline
   - The comma shouldn't start a new line. It should always trail the previous value

Good:
```tsx
const arr = [1, 2, 3];

const arr = [
    1,
    2,
    3,
];
```

Bad:
```tsx
const arr = [1,2,3];

const arr = [ 1, 2, 3 ];

const arr = [ 1 , 2 , 3 ];

const arr = [
    1, 
    2, 
    3
];

const arr = [
    1
  , 2
  , 3 
];
```

### __If statements__

- Avoid single line `if` statements when possible
- Opening parenthesis should not have a space after it but should have a space between it and the `if` syntax
- Closing parenthesis should not have a space before it but should have a space after it and before the open bracket `{` syntax


### __JSX__

Always use `()` surrounding the components in the return so the tags are not offset when auto-formatting the indentations

### __Blocks/if statements__

- The opening brackets should be followed by 1 new line
- The closing brackets should not be in the same line as body logic and should be followed by 1 new line
- The opening brackets should always follow a space and not start at a new line
- The if keyword should always be followed with a space, an opening parenthesis, and another space.
- The test should end with a space, a closing parenthesis, and another space.
- The if statement should always contain a block.
- If there is an else statement, it should be on the same line as the closing bracket of the block.
- The else statement is followed by another block and should be separated from both blocks with a single space on both sides.
- Assignment in a test is not use.

Good:
```tsx
if (someConst === 'some string') {
    return true;
}
```

Bad:
```tsx
if (someConst === 'some string') {
    return false;}

if (someConst === 'some string') { return false;
}

if (someConst === 'some string') return false;

if (someConst === 'some string') { return true; }

if (someConst === 'some string') {
    return false;
}
const newLineCodeTooCloseToBlock = true;

if ( someConst === 'some string') {
    return false;
}

if (someConst === 'some string' ) {
    return false;
}

if(someConst === 'some string') {
    return false;
}

if (someConst === 'some string'){
    return false;
}

if(someConst === 'some string'){
    return false;
}
```

### __The equality operator__

Always use strict equality `===` (inequality `!==` ).

### __Hooks__

Here are important rules to remember about hooks

#### __Dependency arrays__

Variables passed into a dependency array should be sorted alphabetically

```tsx
useEffect(() => {
    /** do something */
}, [dependencyOne, dependencyTwo]);
```

Variables passed into a dependency array should be primitive type or ensure that the [reference checks](https://codeburst.io/explaining-value-vs-reference-in-javascript-647a975e12a0) that occur will result in expected execution

#### __Memoization__

Do not prematurely memoize components or variables with `useMemo` or `useCallback` or `React.memo` unless you are in deep on performance tuning and it is necessary or if the variable you are trying to instantiate is the return of a complex execution