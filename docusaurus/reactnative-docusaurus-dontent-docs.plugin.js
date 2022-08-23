module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        lastVersion: 'current',
        versions: {
          current: {
            label: 'v5',
          },
          '4.x.x': {
            label: 'v4',
            path: 'v4',
            banner: 'unmaintained'
          },
          '3.x.x': {
            label: 'v3',
            path: 'v3',
            banner: 'unmaintained'
          }
        }
      }
    ]
  ]
}
