module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        lastVersion: 'current',
        versions: {
          current: {
            label: 'v4',
          },
          '3.x.x': {
            label: 'v3',
            path: 'v4'
          }
        }
      }
    ]
  ]
}
