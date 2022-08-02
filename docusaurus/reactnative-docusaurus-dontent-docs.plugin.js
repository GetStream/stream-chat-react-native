module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        lastVersion: '4.x.x',
        versions: {
          current: {
            label: 'v5.0.0-rc',
            banner: 'unreleased'
          },
          '4.x.x': {
            label: 'v4',
            path: 'v4',
            banner: 'none'
          },
          '3.x.x': {
            label: 'v3',
            path: 'v3'
          }
        }
      }
    ]
  ]
}
