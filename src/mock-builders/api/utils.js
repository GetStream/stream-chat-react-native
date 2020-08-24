export const mockedApiResponse = (response, type = 'get', status = 200) => ({
  response: {
    data: response,
    status,
  },
  type,
});
