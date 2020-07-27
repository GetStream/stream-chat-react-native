export const mockedApiResponse = (response, type = 'get', status = 200) => ({
  type,
  response: {
    data: response,
    status,
  },
});
