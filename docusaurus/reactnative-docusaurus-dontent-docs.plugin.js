module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        lastVersion: '5.x.x',
        versions: {
          current: {
            label: 'v6',
            path: 'v6',
          },
          '5.x.x': {
            label: 'v5',
          },
          '4.x.x': {
            label: 'v4',
            path: 'v4',
            banner: 'unmaintained',
          },
          '3.x.x': {
            label: 'v3',
            path: 'v3',
            banner: 'unmaintained',
          },
        },
      },
    ],
  ],
};
