import { mockedApiResponse } from './utils';

const defaultErrorObject = {
  duration: 0.01,
  exception_fields: {},
  message: 'API resulted in error',
};

export const erroredGetApi = (customError = {}) => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'get', 500);
};

export const erroredPostApi = (customError = {}) => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'post', 500);
};

export const erroredPutApi = (customError = {}) => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'put', 500);
};

export const erroredDeleteApi = (customError = {}) => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'delete', 500);
};
