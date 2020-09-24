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
<ChannelContext.Provider value={{ editing: true }}>
  <SendButton sendMessage={() => {}} />
</ChannelContext.Provider>
```
