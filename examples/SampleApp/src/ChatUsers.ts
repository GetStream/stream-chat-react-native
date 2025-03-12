import { UserResponse } from 'stream-chat';

export const USER_TOKENS: Record<string, string> = {
  e2etest1:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZTJldGVzdDEifQ.XlQOw8nl7fFzHoBkEiTcYGkNo5r7EBYA40LABGOk4hc',
  e2etest2:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZTJldGVzdDIifQ.2ZsHCMJ7i0vZvRJ5yoT-bm8OD_KAzBgJ-kB6bHGZ4FI',
  e2etest3:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZTJldGVzdDMifQ.RWHY-MYkpP8FTJkfgrxUlCQhwap6eB7DTsp_HsZ1oIw',
  khushal:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoia2h1c2hhbCJ9.NG3b6I8MgkLevwuTTqDXTpOol-Yj_1NCyvxewL_tg4U',
  neil: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibmVpbCJ9.ty2YhwFaVEYkq1iUfY8s1G0Um3MpiVYpWK-b5kMky0w',
  qatest1:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicWF0ZXN0MSJ9.5Nnj6MsauhjP7_D8jW9WbRovLv5uaxn8LPZZ-HB3mh4',
  qatest2:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicWF0ZXN0MiJ9.9v0igQXv_IfL_uKZ6Xz9MXJOS-DMdkeWScJv-POFoTE',
  thierry:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGhpZXJyeSJ9.Rm6o4HHlUE5zYoaJG1YoEE-V219j4KHTqZ9zqXlCHBQ',
  tommaso:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidG9tbWFzbyJ9.sfDKQ5peCwo0oObPDo-AFKauqv5uYbesukOOLpKaDOQ',
  vir: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidmlyIn0.Whk_WyeN9TIuNahSu3KFVRTohF7HDbQq9Ka17kZ6zq4',
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
