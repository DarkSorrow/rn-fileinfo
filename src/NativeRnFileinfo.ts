import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Get file information for a single file
   * @param path The file path to get information for
   * @returns Promise that resolves to FileInfo object
   */
  getFileInfo(path: string): Promise<{
    path: string;
    name: string;
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    createdAt: number;
    modifiedAt: number;
  }>;

  /**
   * Get file information for all files in a directory
   * @param path The directory path to scan
   * @param options Optional configuration for directory scanning
   * @returns Promise that resolves to array of FileInfo objects
   */
  getDirectoryInfo(path: string, options?: {
    recursive?: boolean;
    includeHidden?: boolean;
    maxDepth?: number;
  }): Promise<Array<{
    path: string;
    name: string;
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    createdAt: number;
    modifiedAt: number;
  }>>;

  /**
   * Check if a path exists
   * @param path The path to check
   * @returns Promise that resolves to boolean indicating if path exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Check if a path is a file
   * @param path The path to check
   * @returns Promise that resolves to boolean indicating if path is a file
   */
  isFile(path: string): Promise<boolean>;

  /**
   * Check if a path is a directory
   * @param path The path to check
   * @returns Promise that resolves to boolean indicating if path is a directory
   */
  isDirectory(path: string): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RnFileinfo');