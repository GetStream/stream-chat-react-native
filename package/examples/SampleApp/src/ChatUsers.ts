import { UserResponse } from 'stream-chat';
import { LocalUserType } from './types';

export const USER_TOKENS: Record<string, string> = {
  vishal:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidmlzaGFsIn0.HOlVh-ZyQnjyuL20G-67RTgKufBuAH-I-gbEELFlass',
  vir: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidmlyIn0.Whk_WyeN9TIuNahSu3KFVRTohF7HDbQq9Ka17kZ6zq4',
  tommaso:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidG9tbWFzbyJ9.sfDKQ5peCwo0oObPDo-AFKauqv5uYbesukOOLpKaDOQ',
  neil: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibmVpbCJ9.ty2YhwFaVEYkq1iUfY8s1G0Um3MpiVYpWK-b5kMky0w',
  thierry:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGhpZXJyeSJ9.Rm6o4HHlUE5zYoaJG1YoEE-V219j4KHTqZ9zqXlCHBQ',
  qatest1:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicWF0ZXN0MSJ9.5Nnj6MsauhjP7_D8jW9WbRovLv5uaxn8LPZZ-HB3mh4',
  qatest2:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicWF0ZXN0MiJ9.9v0igQXv_IfL_uKZ6Xz9MXJOS-DMdkeWScJv-POFoTE',
};
export const USERS: Record<string, UserResponse<LocalUserType>> = {
  neil: {
    id: 'neil',
    image: 'https://ca.slack-edge.com/T02RM6X6B-U01173D1D5J-0dead6eea6ea-512',
    name: 'Neil Hannah',
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
  qatest1: {
    id: 'qatest1',
    image: `https://randomuser.me/api/portraits/thumb/men/10.jpg`,
    name: 'QA Test 1',
  },
  qatest2: {
    id: 'qatest2',
    image: `https://randomuser.me/api/portraits/thumb/men/11.jpg`,
    name: 'QA Test 2',
  },
};
