import { ClientUser } from 'stream-chat';

/**
 * Login fixtures, not server responses: these are the payloads handed to `connectUser`, so they
 * carry only `id` / `name` / `image`. Annotated `ClientUser` (everything optional but `id`) rather
 * than `UserResponse`, which since v10 requires the server-owned fields — `created_at`,
 * `updated_at`, `banned`, `language`, `online`, … — that a client has no business inventing.
 */
export const USERS: Record<string, ClientUser> = {
  neil: {
    id: 'neil',
    image: 'https://ca.slack-edge.com/T02RM6X6B-U01173D1D5J-0dead6eea6ea-512',
    name: 'Neil Hannah',
  },
  qatest1: {
    id: 'qatest1',
    image: 'https://randomuser.me/api/portraits/thumb/men/10.jpg',
    name: 'QA Test 1',
  },
  qatest2: {
    id: 'qatest2',
    image: 'https://randomuser.me/api/portraits/thumb/men/11.jpg',
    name: 'QA Test 2',
  },
  khushal: {
    id: 'khushal',
    image: 'https://ca.slack-edge.com/T02RM6X6B-U02DTREQ2KX-41639a005d53-512',
    name: 'Khushal Agarwal',
  },
  thierry: {
    id: 'thierry',
    image: 'https://ca.slack-edge.com/T02RM6X6B-U02RM6X6D-g28a1278a98e-512',
    name: 'Thierry',
  },
  tommaso: {
    id: 'tommaso',
    image: 'https://ca.slack-edge.com/T02RM6X6B-U02U7SJP4-0f65a5997877-512',
    name: 'Tommaso Barbugli',
  },
  vir: {
    id: 'vir',
    image: 'https://ca.slack-edge.com/T02RM6X6B-UMQHWU3PE-9b79299e7415-512',
    name: 'Vir Desai',
  },
  vishal: {
    id: 'vishal',
    image: 'https://ca.slack-edge.com/T02RM6X6B-UHGDQJ8A0-31658896398c-512',
    name: 'Vishal Narkhede',
  },

  // for the purposes of testing threads
  ivan5: {
    id: 'ivan5',
    image: 'https://ca.slack-edge.com/T02RM6X6B-U07GZ78U6BC-9ab8d6408182-192',
    name: 'Ivan Sekovanikj',
  },
  rodolphe: {
    id: 'rodolphe',
    image: 'https://ca.slack-edge.com/T02RM6X6B-U05C1DG31LJ-3e1ec816128d-192',
    name: 'Rodolphe Irany',
  },

  // e2e test users should be last ones in the list

  e2etest1: {
    id: 'e2etest1',
    image: 'https://randomuser.me/api/portraits/thumb/women/10.jpg',
    name: 'E2E Test 1',
  },
  e2etest2: {
    id: 'e2etest2',
    image: 'https://randomuser.me/api/portraits/thumb/women/11.jpg',
    name: 'E2E Test 2',
  },
  e2etest3: {
    id: 'e2etest3',
    image: 'https://randomuser.me/api/portraits/thumb/women/12.jpg',
    name: 'E2E Test 3',
  },
};
