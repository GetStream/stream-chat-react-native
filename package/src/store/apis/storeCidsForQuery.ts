import { createInsertQuery } from '../utils/createInsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const storeCidsForQuery = ({
  cids,
  filtersAndSort,
}: {
  cids: string[];
  filtersAndSort: string;
}) => {
  // Update the database only if the query is provided.
  const query = createInsertQuery('queryChannelsMap', {
    cids: JSON.stringify(cids),
    id: filtersAndSort,
  });

  executeQueries([query]);

  return [query];
};
