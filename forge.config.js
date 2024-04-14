module.exports = {
  packagerConfig: {
    asar: false,
    ignore: [
      'whatsapp-web.js'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: "icon.ico",
        skipUpdateIcon: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  // plugins: [
  //   {
  //     name: '@electron-forge/plugin-auto-unpack-natives',
  //     config: {},
  //   },
  //   // Fuses are used to enable/disable various Electron functionality
  //   // at package time, before code signing the application
  // ],
};
