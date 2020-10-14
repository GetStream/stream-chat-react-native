The thread context exposes the following properties:

- **closeThread** {function} Closes the currently open thread, should be attached to close button on thread UI
- **openThread** {function} Executes on press of the replies count button and navigates user into a thread

  **Params:**

  - **message:** Thread parent message
  - **event:** Native press event
- **loadMoreThread** {function} Loads the next page of messages in a currently active/open thread
- **thread** {object} Parent message containing the list of thread messages
- **threadMessages** {array} Array of messages within a thread
- **threadLoadingMore** {boolean} Whether or not the thread is currently loading more messages
- **threadHasMore** {boolean} Whether or not more messages are available in a currently active thread, set to false when the end of pagination is reached