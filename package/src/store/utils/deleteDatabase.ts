import { DB_LOCATION, DB_NAME, DB_STATUS_ERROR } from '../constants';

export const deleteDatabase = () => {
  const { message, status } = sqlite.delete(DB_NAME, DB_LOCATION);
  if (status === DB_STATUS_ERROR) {
    throw new Error(`Error deleting DB: ${message}`);
  }

  return true;
};
