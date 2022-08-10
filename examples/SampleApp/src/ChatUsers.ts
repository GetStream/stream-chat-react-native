import {UserResponse} from 'stream-chat';
import {StreamChatGenerics} from './types';

export const USER_TOKENS: Record<string, string> = {
  e2etest1:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZTJldGVzdDEifQ.XlQOw8nl7fFzHoBkEiTcYGkNo5r7EBYA40LABGOk4hc',
  e2etest2:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZTJldGVzdDIifQ.2ZsHCMJ7i0vZvRJ5yoT-bm8OD_KAzBgJ-kB6bHGZ4FI',
  e2etest3:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZTJldGVzdDMifQ.RWHY-MYkpP8FTJkfgrxUlCQhwap6eB7DTsp_HsZ1oIw',
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
};
export const USERS: Record<string, UserResponse<StreamChatGenerics>> = {
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
  // e2e test users should be last ones in the list
  // eslint-disable-next-line sort-keys
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
