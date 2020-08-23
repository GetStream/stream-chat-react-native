Send a new message button

```js
<SendButton sendMessage={() => {}} />
```

Disabled send button

```js
<SendButton disabled sendMessage={() => {}} />
```

Send edited message button

```js
<MessagesContext.Provider value={{ editing: true }}>
  <SendButton sendMessage={() => {}} />
</MessagesContext.Provider>
```
