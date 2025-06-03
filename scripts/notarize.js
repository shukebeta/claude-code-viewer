const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Only notarize on macOS
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  
  console.log('Starting notarization process...');
  console.log(`App: ${appOutDir}/${appName}.app`);
  
  try {
    await notarize({
      appBundleId: 'com.mainpy.claude-code-viewer',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    });
    
    console.log('Notarization completed successfully!');
  } catch (error) {
    console.error('Notarization failed:', error);
    throw error;
  }
};