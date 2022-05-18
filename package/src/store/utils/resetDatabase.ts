import { dropTables } from './dropTables';
import { initializeDatabase } from './initializeDatabase';

export const resetDatabase = () => {
  dropTables();
  initializeDatabase();
};
