export type MockedApiResponse = {
  response: { data: unknown; status: number };
  type: 'get' | 'post' | 'put' | 'delete';
};

export const mockedApiResponse = (
  response: unknown,
  type: MockedApiResponse['type'] = 'get',
  status = 200,
): MockedApiResponse => ({
  response: {
    data: response,
    status,
  },
  type,
});
