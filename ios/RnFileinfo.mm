#import "RnFileinfo.h"
#import <React/RCTLog.h>
#import <Foundation/Foundation.h>

@implementation RnFileinfo

RCT_EXPORT_MODULE()

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeRnFileinfoSpecJSI>(params);
}

- (NSString *)cleanPath:(NSString *)path {
  if ([path hasPrefix:@"file://"]) {
    return [path substringFromIndex:7]; // Remove "file://" prefix
  }
  return path;
}

- (void)getFileInfo:(NSString *)path
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject
{
  @try {
    NSString *cleanedPath = [self cleanPath:path];
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSError *error;
    
    // Use lightweight fileExistsAtPath:isDirectory: for better performance
    BOOL isDirectory;
    if (![fileManager fileExistsAtPath:cleanedPath isDirectory:&isDirectory]) {
      reject(@"FILE_NOT_FOUND", [NSString stringWithFormat:@"File not found: %@", path], nil);
      return;
    }
    
    // Get file attributes with minimal overhead
    NSDictionary *attributes = [fileManager attributesOfItemAtPath:cleanedPath error:&error];
    if (error) {
      reject(@"FILE_ACCESS_ERROR", [NSString stringWithFormat:@"Cannot access file: %@", error.localizedDescription], error);
      return;
    }
    
    // Extract file information efficiently
    NSString *fileName = [cleanedPath lastPathComponent];
    NSNumber *fileSize = attributes[NSFileSize];
    NSDate *creationDate = attributes[NSFileCreationDate];
    NSDate *modificationDate = attributes[NSFileModificationDate];
    
    // Convert dates to milliseconds
    NSTimeInterval creationTime = [creationDate timeIntervalSince1970] * 1000;
    NSTimeInterval modificationTime = [modificationDate timeIntervalSince1970] * 1000;
    
    NSDictionary *fileInfo = @{
      @"path": cleanedPath,
      @"name": fileName,
      @"size": fileSize ?: @0,
      @"isFile": @(!isDirectory),
      @"isDirectory": @(isDirectory),
      @"createdAt": @((long long)creationTime),
      @"modifiedAt": @((long long)modificationTime)
    };
    
    resolve(fileInfo);
  } @catch (NSException *exception) {
    reject(@"UNKNOWN_ERROR", [NSString stringWithFormat:@"Unexpected error: %@", exception.reason], nil);
  }
}

- (void)getDirectoryInfo:(NSString *)path
                 options:(JS::NativeRnFileinfo::SpecGetDirectoryInfoOptions &)options
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject
{
  @try {
    NSString *cleanedPath = [self cleanPath:path];
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSError *error;
    
    // Check if directory exists
    if (![fileManager fileExistsAtPath:cleanedPath]) {
      reject(@"DIRECTORY_NOT_FOUND", [NSString stringWithFormat:@"Directory not found: %@", path], nil);
      return;
    }
    
    BOOL isDirectory;
    if (![fileManager fileExistsAtPath:cleanedPath isDirectory:&isDirectory] || !isDirectory) {
      reject(@"NOT_A_DIRECTORY", [NSString stringWithFormat:@"Path is not a directory: %@", path], nil);
      return;
    }
    
    // Parse options
    BOOL recursive = options.recursive().has_value() ? options.recursive().value() : NO;
    BOOL includeHidden = options.includeHidden().has_value() ? options.includeHidden().value() : NO;
    NSInteger maxDepth = options.maxDepth().has_value() ? (NSInteger)options.maxDepth().value() : NSIntegerMax;
    
    NSMutableArray *fileInfos = [NSMutableArray array];
    [self scanDirectory:cleanedPath
            fileManager:fileManager
               recursive:recursive
           includeHidden:includeHidden
                maxDepth:maxDepth
              currentDepth:0
              fileInfos:fileInfos
                   error:&error];
    
    if (error) {
      reject(@"DIRECTORY_ACCESS_ERROR", [NSString stringWithFormat:@"Cannot access directory: %@", error.localizedDescription], error);
      return;
    }
    
    resolve(fileInfos);
  } @catch (NSException *exception) {
    reject(@"UNKNOWN_ERROR", [NSString stringWithFormat:@"Unexpected error: %@", exception.reason], nil);
  }
}

- (void)scanDirectory:(NSString *)directoryPath
          fileManager:(NSFileManager *)fileManager
             recursive:(BOOL)recursive
         includeHidden:(BOOL)includeHidden
              maxDepth:(NSInteger)maxDepth
          currentDepth:(NSInteger)currentDepth
            fileInfos:(NSMutableArray *)fileInfos
                 error:(NSError **)error
{
  if (currentDepth >= maxDepth) {
    return;
  }
  
  // Use efficient directory enumeration with proper error handling
  NSArray *contents = [fileManager contentsOfDirectoryAtPath:directoryPath error:error];
  if (*error) {
    return;
  }
  
  // Process files in batches to prevent memory issues
  const NSInteger MAX_FILES_PER_BATCH = 1000;
  if (contents.count > MAX_FILES_PER_BATCH) {
    // Process in batches for very large directories
    for (NSInteger i = 0; i < contents.count; i += MAX_FILES_PER_BATCH) {
      NSInteger endIndex = MIN(i + MAX_FILES_PER_BATCH, contents.count);
      NSArray *batch = [contents subarrayWithRange:NSMakeRange(i, endIndex - i)];
      [self processFileBatch:batch
                 directoryPath:directoryPath
                    fileManager:fileManager
                      recursive:recursive
                  includeHidden:includeHidden
                       maxDepth:maxDepth
                   currentDepth:currentDepth
                     fileInfos:fileInfos
                          error:error];
      if (*error) {
        return;
      }
    }
    return;
  }
  
  for (NSString *item in contents) {
    // Skip hidden files if not including them
    if (!includeHidden && [item hasPrefix:@"."]) {
      continue;
    }
    
    NSString *fullPath = [directoryPath stringByAppendingPathComponent:item];
    
    // Get file attributes with proper error handling
    NSDictionary *attributes = [fileManager attributesOfItemAtPath:fullPath error:error];
    if (*error) {
      return;
    }
    
    // Extract file information efficiently
    NSNumber *fileSize = attributes[NSFileSize];
    NSDate *creationDate = attributes[NSFileCreationDate];
    NSDate *modificationDate = attributes[NSFileModificationDate];
    BOOL isDirectory = [attributes[NSFileType] isEqualToString:NSFileTypeDirectory];
    
    // Convert dates to milliseconds
    NSTimeInterval creationTime = [creationDate timeIntervalSince1970] * 1000;
    NSTimeInterval modificationTime = [modificationDate timeIntervalSince1970] * 1000;
    
    NSDictionary *fileInfo = @{
      @"path": fullPath,
      @"name": item,
      @"size": fileSize ?: @0,
      @"isFile": @(!isDirectory),
      @"isDirectory": @(isDirectory),
      @"createdAt": @((long long)creationTime),
      @"modifiedAt": @((long long)modificationTime),
    };
    
    [fileInfos addObject:fileInfo];
    
    // Recursively scan subdirectories if enabled
    if (recursive && isDirectory) {
      [self scanDirectory:fullPath
              fileManager:fileManager
                 recursive:recursive
             includeHidden:includeHidden
                  maxDepth:maxDepth
              currentDepth:currentDepth + 1
                fileInfos:fileInfos
                     error:error];
      if (*error) {
        return;
      }
    }
  }
}

- (void)processFileBatch:(NSArray *)batch
            directoryPath:(NSString *)directoryPath
               fileManager:(NSFileManager *)fileManager
                 recursive:(BOOL)recursive
             includeHidden:(BOOL)includeHidden
                  maxDepth:(NSInteger)maxDepth
              currentDepth:(NSInteger)currentDepth
                fileInfos:(NSMutableArray *)fileInfos
                     error:(NSError **)error
{
  for (NSString *item in batch) {
    // Skip hidden files if not including them
    if (!includeHidden && [item hasPrefix:@"."]) {
      continue;
    }
    
    NSString *fullPath = [directoryPath stringByAppendingPathComponent:item];
    
    // Get file attributes with proper error handling
    NSDictionary *attributes = [fileManager attributesOfItemAtPath:fullPath error:error];
    if (*error) {
      return;
    }
    
    // Extract file information efficiently
    NSNumber *fileSize = attributes[NSFileSize];
    NSDate *creationDate = attributes[NSFileCreationDate];
    NSDate *modificationDate = attributes[NSFileModificationDate];
    BOOL isDirectory = [attributes[NSFileType] isEqualToString:NSFileTypeDirectory];
    
    // Convert dates to milliseconds
    NSTimeInterval creationTime = [creationDate timeIntervalSince1970] * 1000;
    NSTimeInterval modificationTime = [modificationDate timeIntervalSince1970] * 1000;
    
    NSDictionary *fileInfo = @{
      @"path": fullPath,
      @"name": item,
      @"size": fileSize ?: @0,
      @"isFile": @(!isDirectory),
      @"isDirectory": @(isDirectory),
      @"createdAt": @((long long)creationTime),
      @"modifiedAt": @((long long)modificationTime),
    };
    
    [fileInfos addObject:fileInfo];
    
    // Recursively scan subdirectories if enabled
    if (recursive && isDirectory) {
      [self scanDirectory:fullPath
              fileManager:fileManager
                 recursive:recursive
             includeHidden:includeHidden
                  maxDepth:maxDepth
              currentDepth:currentDepth + 1
                fileInfos:fileInfos
                     error:error];
      if (*error) {
        return;
      }
    }
  }
}

- (void)exists:(NSString *)path
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject
{
  @try {
    NSString *cleanedPath = [self cleanPath:path];
    NSFileManager *fileManager = [NSFileManager defaultManager];
    BOOL exists = [fileManager fileExistsAtPath:cleanedPath];
    resolve(@(exists));
  } @catch (NSException *exception) {
    reject(@"UNKNOWN_ERROR", [NSString stringWithFormat:@"Unexpected error: %@", exception.reason], nil);
  }
}

- (void)isFile:(NSString *)path
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject
{
  @try {
    NSString *cleanedPath = [self cleanPath:path];
    NSFileManager *fileManager = [NSFileManager defaultManager];
    BOOL isDirectory;
    BOOL exists = [fileManager fileExistsAtPath:cleanedPath isDirectory:&isDirectory];
    resolve(@(exists && !isDirectory));
  } @catch (NSException *exception) {
    reject(@"UNKNOWN_ERROR", [NSString stringWithFormat:@"Unexpected error: %@", exception.reason], nil);
  }
}

- (void)isDirectory:(NSString *)path
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  @try {
    NSString *cleanedPath = [self cleanPath:path];
    NSFileManager *fileManager = [NSFileManager defaultManager];
    BOOL isDirectory;
    BOOL exists = [fileManager fileExistsAtPath:cleanedPath isDirectory:&isDirectory];
    resolve(@(exists && isDirectory));
  } @catch (NSException *exception) {
    reject(@"UNKNOWN_ERROR", [NSString stringWithFormat:@"Unexpected error: %@", exception.reason], nil);
  }
}

@end