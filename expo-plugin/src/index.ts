import { ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import { promises as fs } from 'fs';
import path from 'path';

const withRnFileinfo: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformProjectRoot = config.modRequest.platformProjectRoot;
      
      // Add the podspec to the Podfile
      const podfilePath = path.join(platformProjectRoot, 'Podfile');
      
      try {
        const podfileContent = await fs.readFile(podfilePath, 'utf8');
        
        // Check if the pod is already added
        if (!podfileContent.includes('RnFileinfo')) {
          const podEntry = "  pod 'RnFileinfo', :path => '../node_modules/@novastera-oss/rn-fileinfo'\n";
          
          // Find the target section and add the pod
          const targetRegex = /target ['"]([^'"]+)['"] do/g;
          const newPodfileContent = podfileContent.replace(
            targetRegex,
            (match, targetName) => {
              return `${match}\n${podEntry}`;
            }
          );
          
          await fs.writeFile(podfilePath, newPodfileContent);
          console.log('✅ Added RnFileinfo pod to Podfile');
        }
      } catch (error) {
        console.warn('⚠️ Could not modify Podfile:', error);
      }
      
      return config;
    },
  ]);
};

export default withRnFileinfo;
