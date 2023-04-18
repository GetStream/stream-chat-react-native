import { generateRandomId } from 'stream-chat-react-native';

import type { Attachment } from 'stream-chat';

const messageSearchByFileAttachmentType = () => {
  const attachments: Attachment[] = [
    {
      asset_url: 'https://getstream.io',
      file_size: Math.random() * 10000,
      id: generateRandomId(),
      mime_type: 'application/pdf',
      title: `SlimAron.pdf`,
      type: 'file',
    },
    {
      asset_url: 'https://getstream.io',
      file_size: Math.random() * 10000,
      id: generateRandomId(),
      mime_type: 'application/vnd.ms-powerpoint',
      title: `Resume.ppt`,
      type: 'file',
    },
    {
      asset_url: 'https://getstream.io',
      file_size: Math.random() * 10000,
      id: generateRandomId(),
      mime_type: 'application/vnd.ms-excel',
      title: `RocketLaunch.xls`,
      type: 'file',
    },
    {
      asset_url: 'https://getstream.io',
      file_size: Math.random() * 10000,
      id: generateRandomId(),
      mime_type: 'application/x-7z-compressed',
      title: `Resume.zip`,
      type: 'file',
    },
  ];

  const results = [];

  for (let i = 0; i < 10; i++) {
    const message = {
      attachments,
      id: generateRandomId(),
      text: generateRandomId(),
      user: {
        id: generateRandomId(),
        name: 'Vishal narkhede',
      },
    };
    results.push({
      message,
    });
  }

  return {
    results,
  };
};

const messageSearchByImageAttachmentType = () => {
  const attachments: Attachment[] = [
    {
      id: generateRandomId(),
      image_url:
        'https://randomwordgenerator.com/img/picture-generator/55e1d4424a5ba914f1dc8460962e33791c3ad6e04e507440742a7ad69545c7_640.jpg',
      type: 'image',
    },
    {
      id: generateRandomId(),
      image_url:
        'https://randomwordgenerator.com/img/picture-generator/57e4d5464f51a814f1dc8460962e33791c3ad6e04e5074417c2d78d1924fcd_640.jpg',
      type: 'image',
    },
    {
      id: generateRandomId(),
      image_url:
        'https://randomwordgenerator.com/img/picture-generator/buckled-book-2180047_640.jpg',
      type: 'image',
    },
    {
      id: generateRandomId(),
      image_url:
        'https://randomwordgenerator.com/img/picture-generator/53e3d6404c57ad14f1dc8460962e33791c3ad6e04e507440762e7ad3934dcd_640.jpg',
      type: 'image',
    },
    {
      id: generateRandomId(),
      image_url:
        'https://randomwordgenerator.com/img/picture-generator/55e2d5444a5ba414f1dc8460962e33791c3ad6e04e5074417c2a79dd954ac2_640.jpg',
      type: 'image',
    },
    {
      id: generateRandomId(),
      image_url: 'https://randomwordgenerator.com/img/picture-generator/natural-4946737_640.jpg',
      type: 'image',
    },
    {
      id: generateRandomId(),
      image_url:
        'https://randomwordgenerator.com/img/picture-generator/57e4dc44434faa0df7c5d57bc32f3e7b1d3ac3e45551754c7c287bd596_640.jpg',
      type: 'image',
    },
    {
      id: generateRandomId(),
      image_url:
        'https://randomwordgenerator.com/img/picture-generator/57e5d64a4a5aa914f1dc8460962e33791c3ad6e04e507440712b7bd29644cd_640.jpg',
      type: 'image',
    },
    {
      id: generateRandomId(),
      image_url:
        'https://randomwordgenerator.com/img/picture-generator/54e1d3434a57a514f1dc8460962e33791c3ad6e04e50744172277ed79044cd_640.jpg',
      type: 'image',
    },
    {
      id: generateRandomId(),
      image_url:
        'https://randomwordgenerator.com/img/picture-generator/57e5d5434d57aa14f1dc8460962e33791c3ad6e04e507440762a7cd4914fc6_640.jpg',
      type: 'image',
    },
  ];

  const results = [];

  for (let i = 0; i < 10; i++) {
    const message = {
      attachments,
      id: generateRandomId(),
      text: generateRandomId(),
      user: {
        id: generateRandomId(),
        name: 'Vishal narkhede',
      },
    };
    results.push({
      message,
    });
  }

  return {
    results,
  };
};

export const MockDataService = {
  messageSearchByAttachmentType: (type: string) => {
    if (type === 'file') {
      return messageSearchByFileAttachmentType();
    }

    if (type === 'image') {
      return messageSearchByImageAttachmentType();
    }
  },
};
