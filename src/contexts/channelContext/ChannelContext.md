The channel context exposes the following properties:

- **channel** {object} The currently active chat channel
- **disabled** {boolean} Whether or not the channel UI is frozen/disabled
- **EmptyStateIndicator** {component} UI component for empty Channel state
- **error** {boolean} Whether or not the channel errored on loading
- **eventHistory** {object} History of all native events received during a session
- **lastRead** {Date} Latest initialization of the channel
- **loading** {boolean} Whether or not the channel is currently loading
- **markRead** {function} Marks the current channel as read, runs on channel mount
- **members** {object} All members of the current channel

**Example:**

```json
{
  "thierry-123": {
    "id": "thierry-123",
    "role": "user",
    "created_at": "2019-04-03T14:42:47.087869Z",
    "updated_at": "2019-04-16T09:20:03.982283Z",
    "last_active": "2019-04-16T11:23:51.168113408+02:00",
    "online": true
  },
  "vishal-123": {
    "id": "vishal-123",
    "role": "user",
    "created_at": "2019-05-03T14:42:47.087869Z",
    "updated_at": "2019-05-16T09:20:03.982283Z",
    "last_active": "2019-06-16T11:23:51.168113408+02:00",
    "online": false
  }
}
```
- **read** {object} The read state for each user
- **typing** {object} Map of user IDs for currently typing users, corresponds to the `typing.start` [event](https://getstream.io/chat/docs/#event_object)

**Example:**

```json
{
  "user_id_1": typing_event_object_of_user_1,
  "user_id_2": typing_event_object_of_user_2
}
```
- **watcher_count** {number} Number of members watching the channel
- **watchers** {object} Map of user IDs for users currently online and watching the channel

**Example:**

```json
{
  "thierry-123": {
    "id": "thierry-123",
    "role": "user",
    "created_at": "2019-04-03T14:42:47.087869Z",
    "updated_at": "2019-04-16T09:20:03.982283Z",
    "last_active": "2019-04-16T11:23:51.168113408+02:00",
    "online": true
  },
  "vishal-123": {
    "id": "vishal-123",
    "role": "user",
    "created_at": "2019-05-03T14:42:47.087869Z",
    "updated_at": "2019-05-16T09:20:03.982283Z",
    "last_active": "2019-06-16T11:23:51.168113408+02:00",
    "online": true
  }
}
```

