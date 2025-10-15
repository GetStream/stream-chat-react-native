import { UserResponse } from 'stream-chat';

export const STREAM_API_KEY = 'yjrt5yxw77ev';

export const USER_TOKENS: Record<string, string> = {
  neil: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibmVpbCJ9.ty2YhwFaVEYkq1iUfY8s1G0Um3MpiVYpWK-b5kMky0w',
  khushal:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoia2h1c2hhbCJ9.NG3b6I8MgkLevwuTTqDXTpOol-Yj_1NCyvxewL_tg4U',
  thierry:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGhpZXJyeSJ9.Rm6o4HHlUE5zYoaJG1YoEE-V219j4KHTqZ9zqXlCHBQ',
  tommaso:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidG9tbWFzbyJ9.sfDKQ5peCwo0oObPDo-AFKauqv5uYbesukOOLpKaDOQ',
  vishal:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidmlzaGFsIn0.HOlVh-ZyQnjyuL20G-67RTgKufBuAH-I-gbEELFlass',
  ivan5:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiaXZhbjUifQ.c3nq6rlnqyNeCRcwiW0VQ413nHl99pF72Ia2V_N84yU',
  rodolphe:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicm9kb2xwaGUifQ.tLl-I8ADBhTKB-x5FB9jK4-am0dELLXgydM6VN9rTL8',
};

export const USERS: Record<string, UserResponse> = {
  neil: {
    id: 'neil',
    image: 'https://ca.slack-edge.com/T02RM6X6B-U01173D1D5J-0dead6eea6ea-512',
    name: 'Neil Hannah',
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
};
