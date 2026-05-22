import { mockedApiResponse, type MockedApiResponse } from './utils';

type CustomError = Partial<{
  duration: number;
  exception_fields: Record<string, unknown>;
  message: string;
  code: number;
  StatusCode: number;
}>;

const defaultErrorObject = {
  duration: 0.01,
  exception_fields: {},
  message: 'API resulted in error',
};

export const erroredGetApi = (customError: CustomError = {}): MockedApiResponse => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'get', 500);
};

export const erroredPostApi = (customError: CustomError = {}): MockedApiResponse => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'post', 500);
};

export const erroredPutApi = (customError: CustomError = {}): MockedApiResponse => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'put', 500);
};

export const erroredDeleteApi = (customError: CustomError = {}): MockedApiResponse => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'delete', 500);
};
