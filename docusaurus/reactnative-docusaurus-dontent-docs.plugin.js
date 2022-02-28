module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        lastVersion: 'current',
        versions: {
          current: {
            label: '4.1.0',
          },
          '3.x.x': {
            label: '3.x.x',
            path: '3.x.x'
          }
        }
      }
    ]
  ]
}
