import { DB_LOCATION, DB_NAME, DB_STATUS_ERROR } from '../constants';

export const openDB = () => {
  const { message, status } = sqlite.open(DB_NAME, DB_LOCATION);
  if (status === DB_STATUS_ERROR) {
    console.error(`Error opening database ${DB_NAME}: ${message}`);
  }
};
