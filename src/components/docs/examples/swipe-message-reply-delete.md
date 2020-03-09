# Swipe message left to delete and right to reply

Some messaging apps usually show extra options such as delete or reply when you swipe the message.
In this example we will build a message which opens `delete` opion when swiped left, and will reply
to the message when swiped to left.

For swiping gesture, we are going to use external library called [react-native-swipe-list-view](https://github.com/jemise111/react-native-swipe-list-view)

Also I am going to use following styles for this example:

```js static
const messageSwipableStyles = StyleSheet.create({
  row: {
    flex: 1,
    backgroundColor: 'blue',
  },
  messageActionsContainer: {
    backgroundColor: '#F8F8F8',
  },
  deletebutton: {
    alignSelf: 'flex-end',
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignContent: 'center',
    borderLeftColor: '#A8A8A8',
    borderLeftWidth: 1,
  },
  deleteIcon: {
    width: 30,
    height: 30,
    alignSelf: 'center',
  },
  messageContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  messageContainerSelected: {
    backgroundColor: '#F8F8F8',
  },
});
```

First lets just build a simple swipable message component, which when swiped left, opens the delete button.
We will use `SwipeRow` as wrapper around our MessageSimple component.

```js
import {SwipeRow} from 'react-native-swipe-list-view';
...

class MessageSwipable extends React.Component {
  render() {
    return (
      <SwipeRow
        rightOpenValue={-55}
        leftOpenValue={30}
        recalculateHiddenLayout>
        <View>
            <TouchableOpacity style={messageSwipableStyles.deletebutton}>
              <Image source={deleteIcon} styles={messageSwipableStyles.deleteIcon} />
            </TouchableOpacity>
        </View>
        <View>
          <MessageSimple {...this.props} />
        </View>
      </SwipeRow>
    );
  }
}
```

You will see some really distorted UI at this point. Don't worry, we just need to add some nice styles to fix it:

```diff
class MessageSwipable extends React.Component {
  render() {
    return (
      <SwipeRow
        rightOpenValue={-55}
        leftOpenValue={30}
+       style={messageSwipableStyles.row}
        recalculateHiddenLayout>
-        <View>
+        <View style={messageSwipableStyles.messageActionsContainer}>
-          <TouchableOpacity>
+          <TouchableOpacity style={messageSwipableStyles.deletebutton}>
            <Image
              source={deleteIcon}
+             style={messageSwipableStyles.deleteIcon}
            />
          </TouchableOpacity>
        </View>
-        <View>
+        <View style={messageSwipableStyles.messageContainer}>
          <MessageSimple {...this.props} />
        </View>
      </SwipeRow>
    );
  }
}
```

You will see a nice button appearing on right on the message, when message is swiped left.

Next, we want to open a thread or reply screen when message is swiped right. For this we are going to use `onRowOpen`
callback prop function on `SwipeRow`. This callback gets the swipe offset as parameter. When this offset is positive,
that means its a right swipe, otherwise left.

So when user swipes right on message, we want to call the function `onThreadSelect()`, which is available
in props of message component. 

Also we are going to add some different styles when delete button/option is visible on message. For this we add a state variable
`menuOpen` to keep track of whether delete button is visible or not.

```diff
class MessageSwipable extends React.Component {
+  rowRef = null;
+  state = {menuOpen: false};

  render() {
    return (
      <SwipeRow
        rightOpenValue={-55}
        leftOpenValue={30}
        style={messageSwipableStyles.row}
        recalculateHiddenLayout
+        onRowOpen={value => {
+          if (value > 0) {
+            this.props.onThreadSelect(this.props.message);
+            this.rowRef.closeRow();
+          } else {
+            this.setState({menuOpen: true});
+          }
+        }}
+        ref={ref => {
+          this.rowRef = ref;
+        }}>
        <View style={messageSwipableStyles.messageActionsContainer}>
          <TouchableOpacity style={messageSwipableStyles.deletebutton}>
            <Image
              source={deleteIcon}
              style={messageSwipableStyles.deleteIcon}
            />
          </TouchableOpacity>
        </View>
-        <View style={messageSwipableStyles.messageContainer}>
+        <View
+          style={
+            this.state.menuOpen
+              ? {
+                  ...messageSwipableStyles.messageContainer,
+                  ...messageSwipableStyles.messageContainerSelected,
+                }
+              : {...messageSwipableStyles.messageContainer}
+          }>
          <MessageSimple {...this.props} />
        </View>
      </SwipeRow>
    );
  }
}
```

Next, when delete button gets pressed, we want to delete the message and close the row.

```diff
class MessageSwipable extends React.Component {
  rowRef = null;
  state = {menuOpen: false};

  render() {
    return (
      <SwipeRow
        rightOpenValue={-55}
        leftOpenValue={30}
        recalculateHiddenLayout
        onRowOpen={value => {
          if (value > 0) {
            this.props.onThreadSelect(this.props.message);
            this.rowRef.closeRow();
          } else {
            this.setState({menuOpen: true});
          }
        }}
        ref={ref => {
          this.rowRef = ref;
        }}>
        <View style={messageSwipableStyles.messageActionsContainer}>
-          <TouchableOpacity style={messageSwipableStyles.deletebutton}>
+          <TouchableOpacity
+            style={messageSwipableStyles.deletebutton}
+            onPress={() => {
+              this.props.handleDelete();
+              this.rowRef.closeRow();
+            }}>
+            <Image
+              source={deleteIcon}
+              style={messageSwipableStyles.deleteIcon}
+            />
          </TouchableOpacity>
        </View>
        <View
          style={
            this.state.menuOpen
              ? {
                  ...messageSwipableStyles.messageContainer,
                  ...messageSwipableStyles.messageContainerSelected,
                }
              : {...messageSwipableStyles.messageContainer}
          }>
          <MessageSimple {...this.props} />
        </View>
      </SwipeRow>
    );
  }
}
```

Next, we to restrict swipable functionality only for non-deleted messages.

```diff
class MessageSwipable extends React.Component {
  rowRef = null;
  state = {menuOpen: false};

  render() {
    return (
      <SwipeRow
        rightOpenValue={-55}
        leftOpenValue={30}
        recalculateHiddenLayout
+        disableLeftSwipe={!!this.props.message.deleted_at}
+        disableRightSwipe={!!this.props.message.deleted_at}
        onRowOpen={value => {
          if (value > 0) {
            this.props.onThreadSelect(this.props.message);
            this.rowRef.closeRow();
          } else {
            this.setState({menuOpen: true});
          }
        }}
        ref={ref => {
          this.rowRef = ref;
        }}>
-        <View style={messageSwipableStyles.messageActionsContainer}>
+        <View
+          style={
+            !this.props.message.deleted_at
+              ? messageSwipableStyles.messageActionsContainer
+              : null
+          }>
+          {!this.props.message.deleted_at ? (
+            <TouchableOpacity
+              style={messageSwipableStyles.deletebutton}
+              onPress={() => {
+                this.props.handleDelete();
+                this.rowRef.closeRow();
+              }}>
+              <Image
+                source={deleteIcon}
+                style={messageSwipableStyles.deleteIcon}
+              />
+            </TouchableOpacity>
+          ) : null}
        </View>
        <View
          style={
            this.state.menuOpen
              ? {
                  ...messageSwipableStyles.messageContainer,
                  ...messageSwipableStyles.messageContainerSelected,
                }
              : {...messageSwipableStyles.messageContainer}
          }>
          <MessageSimple {...this.props} />
        </View>
      </SwipeRow>
    );
  }
}
```

And we are done. Soon we will publish the running example of this on our repo!

_**in progress ...**_

## Final result:

```js
class MessageSwipable extends React.Component {
  rowRef = null;
  state = {menuOpen: false};
  render() {
    return (
      <SwipeRow
        rightOpenValue={-55}
        leftOpenValue={30}
        disableLeftSwipe={!!this.props.message.deleted_at}
        disableRightSwipe={!!this.props.message.deleted_at}
        style={messageSwipableStyles.row}
        recalculateHiddenLayout
        onRowClose={() => {
          this.setState({menuOpen: false});
        }}
        onRowOpen={value => {
          if (value > 0) {
            this.props.onThreadSelect(this.props.message);
            this.rowRef.closeRow();
          } else {
            this.setState({menuOpen: true});
          }
        }}
        ref={ref => {
          this.rowRef = ref;
        }}>
        <View
          style={
            !this.props.message.deleted_at
              ? messageSwipableStyles.messageActionsContainer
              : null
          }>
          {!this.props.message.deleted_at ? (
            <TouchableOpacity
              style={messageSwipableStyles.deletebutton}
              onPress={() => {
                this.props.handleDelete();
                this.rowRef.closeRow();
              }}>
              <Image
                source={deleteIcon}
                style={messageSwipableStyles.deleteIcon}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <View
          style={
            this.state.menuOpen
              ? {
                  ...messageSwipableStyles.messageContainer,
                  ...messageSwipableStyles.messageContainerSelected,
                }
              : {...messageSwipableStyles.messageContainer}
          }>
          <MessageSimple {...this.props} />
        </View>
      </SwipeRow>
    );
  }
}

const messageSwipableStyles = StyleSheet.create({
  row: {
    flex: 1,
    backgroundColor: 'blue',
  },
  messageActionsContainer: {
    backgroundColor: '#F8F8F8',
  },
  deletebutton: {
    alignSelf: 'flex-end',
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignContent: 'center',
    borderLeftColor: '#A8A8A8',
    borderLeftWidth: 1,
  },
  deleteIcon: {
    width: 30,
    height: 30,
    alignSelf: 'center',
  },
  messageContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  messageContainerSelected: {
    backgroundColor: '#F8F8F8',
  },
});
```

