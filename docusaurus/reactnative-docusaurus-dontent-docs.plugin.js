module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        lastVersion: '3.x.x',
        versions: {
          current: {
            label: '4.0.0-next (beta)',
            banner: 'unreleased',
            path: '4.0.0'
          },
          '3.x.x': {
            label: '3.x.x',
          }
        }
      }
    ]
  ]
}
