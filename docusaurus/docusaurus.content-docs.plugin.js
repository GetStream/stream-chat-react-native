module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        lastVersion: "3.0.0",
        versions: {
          current: {
            label: '4.0.0',
            banner: 'unreleased',
            path: '4.0.0'
          },
          '3.0.0': {
            label: '3.0.0',
          }
        }
      }
    ]
  ]
}
