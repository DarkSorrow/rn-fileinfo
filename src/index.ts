import NativeRnFileinfo from './NativeRnFileinfo';

// Export the native module directly
export default NativeRnFileinfo;

// Export individual methods for convenience
export const getFileInfo = NativeRnFileinfo.getFileInfo;
export const getDirectoryInfo = NativeRnFileinfo.getDirectoryInfo;
export const exists = NativeRnFileinfo.exists;
export const isFile = NativeRnFileinfo.isFile;
export const isDirectory = NativeRnFileinfo.isDirectory;
