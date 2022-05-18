import { DB_NAME, DB_STATUS_ERROR } from '../constants';

export const closeDB = () => {
  const { message, status } = sqlite.close(DB_NAME);
  if (status === DB_STATUS_ERROR) {
    console.error(`Error closing database ${DB_NAME}: ${message}`);
  }
};
