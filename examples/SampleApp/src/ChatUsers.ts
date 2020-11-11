import { UserResponse } from "stream-chat";
import { LocalUserType } from "./types";

export const USER_TOKENS: Record<string, string> = {
  cilvia:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiY2lsdmlhIn0.jHi2vjKoF02P9lOog0kDVhsIrGFjuWJqZelX5capR30',
  jaap:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiamFhcCJ9.sstFIcmLQTvUWCBNOHqPuqYQsAJcBas-BJ_F1HVRfzQ',
  josh:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiam9zaCJ9.SSK1tAzqDMmCei1Y498YDYhWIFljZzZtsCGmCdu5AC4',
  luke:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibHVrZSJ9.zvTMRzjR5t4K5sK0VjczbPoOYhYxSdBeoa_P9jZuuiY',
  marcelo:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyY2VsbyJ9.xpFoSta53fovRpyULXavYdv2qO5bLG0HpyEFxmYOMlY',
  merel:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWVyZWwifQ.JVArAc-pY81HkXtbGzuxHrzdf8A9BQ3ZlB5hqRv47D4',
  nick:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibmljayJ9.vTiCq9nYrT3BJhILVSGMbC-mKzu-PHvBGPNWmLFH0mE',
  scott:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic2NvdHQifQ.gzFcAl2dONxXWZmR1e-iUXOK-RIa1Gi7IfcNeq4hY5M',
  thierry:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGhpZXJyeSJ9.iyGzbWInSA6B-0CE1Q9_lPOWjHvrWX3ypDhLYAL1UUs',
  tommaso:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidG9tbWFzbyJ9.wuLqzU1D6RYKokmzkgyFvQ43lWF7dMVGt5NOLwHNqyc',
  vishal:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidmlzaGFsIn0.LpDqH6U8V8Qg9sqGjz0bMQvOfWrWKAjPKqeODYM0Elk',
};
export const USERS: Record<string, UserResponse<LocalUserType>> = {
  cilvia: {
    id: 'cilvia',
    image: 'https://ca.slack-edge.com/T02RM6X6B-U01173D1D5J-0dead6eea6ea-512',
    name: 'Neil Hannah',
  },
  jaap: {
    id: 'jaap',
    image: 'https://ca.slack-edge.com/T02RM6X6B-U9V0XUAD6-1902c9825828-512',
    name: 'Jaap Baker',
  },
  josh: {
    id: 'josh',
    image: 'https://ca.slack-edge.com/T02RM6X6B-U0JNN4BFE-52b2c5f7e1f6-512',
    name: 'Joshua',
  },
  marcelo: {
    id: 'marcelo',
    image: 'https://ca.slack-edge.com/T02RM6X6B-UD6TCA6P6-2b60e1b19771-512',
    name: 'Marcelo Pires',
  },
  merel: {
    id: 'merel',
    image: 'https://ca.slack-edge.com/T02RM6X6B-ULM9UDW58-4c56462d52a4-512',
    name: 'Merel',
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
  // luke: {
  //   id: 'luke',
  //   name: 'Luke',
  //   image: 'https://ca.slack-edge.com/T02RM6X6B-UHLLRBJBU-4d0ebdff049c-512',
  // },
  // nick: {
  //   id: 'nick',
  //   name: 'Nick Parson',
  //   image: 'https://ca.slack-edge.com/T02RM6X6B-U10BF2R9R-2e7377522518-512',
  // },
  // scott: {
  //   id: 'scott',
  //   name: 'Scott',
  //   image: 'https://ca.slack-edge.com/T02RM6X6B-U5KT650MQ-5a65b75846de-512',
  // },
};
