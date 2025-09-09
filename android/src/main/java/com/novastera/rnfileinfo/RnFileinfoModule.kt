package com.novastera.rnfileinfo

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import java.io.File

@ReactModule(name = RnFileinfoModule.NAME)
class RnFileinfoModule(private val reactContext: ReactApplicationContext) : NativeRnFileinfoSpec(reactContext) {
    
    companion object {
        const val NAME = "RnFileinfo"
    }

    override fun getName(): String = NAME

    /**
     * Clean file path by removing file:// prefix if present
     */
    private fun cleanPath(path: String): String {
        return if (path.startsWith("file://")) {
            path.substring(7) // Remove "file://" prefix
        } else {
            path
        }
    }

    override fun getFileInfo(path: String, promise: Promise) {
        try {
            val cleanedPath = cleanPath(path)
            val file = File(cleanedPath)
            
            // Use lightweight exists() check for better performance
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "File not found: $path")
                return
            }

            val fileInfo = WritableNativeMap().apply {
                putString("path", file.absolutePath)
                putString("name", file.name)
                putDouble("size", file.length().toDouble())
                putBoolean("isFile", file.isFile)
                putBoolean("isDirectory", file.isDirectory)
                putDouble("createdAt", file.lastModified().toDouble()) // Android doesn't provide creation time
                putDouble("modifiedAt", file.lastModified().toDouble())
            }

            promise.resolve(fileInfo)
        } catch (e: Exception) {
            promise.reject("UNKNOWN_ERROR", "Unexpected error: ${e.message}", e)
        }
    }

    override fun getDirectoryInfo(path: String, options: ReadableMap?, promise: Promise) {
        try {
            val cleanedPath = cleanPath(path)
            val file = File(cleanedPath)
            
            if (!file.exists()) {
                promise.reject("DIRECTORY_NOT_FOUND", "Directory not found: $path")
                return
            }

            if (!file.isDirectory) {
                promise.reject("NOT_A_DIRECTORY", "Path is not a directory: $path")
                return
            }

            val recursive = if (options?.hasKey("recursive") == true) options.getBoolean("recursive") else false
            val includeHidden = if (options?.hasKey("includeHidden") == true) options.getBoolean("includeHidden") else false
            val maxDepth = if (options?.hasKey("maxDepth") == true) options.getInt("maxDepth") else Int.MAX_VALUE

            val fileInfos = mutableListOf<WritableMap>()
            scanDirectory(file, fileInfos, recursive, includeHidden, maxDepth, 0)

            val result = WritableNativeArray()
            fileInfos.forEach { result.pushMap(it) }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("UNKNOWN_ERROR", "Unexpected error: ${e.message}", e)
        }
    }

    private fun scanDirectory(
        directory: File,
        fileInfos: MutableList<WritableMap>,
        recursive: Boolean,
        includeHidden: Boolean,
        maxDepth: Int,
        currentDepth: Int
    ) {
        if (currentDepth >= maxDepth) {
            return
        }

        val files = directory.listFiles() ?: return
        
        // Limit the number of files processed in a single batch to prevent memory issues
        val MAX_FILES_PER_BATCH = 1000
        if (files.size > MAX_FILES_PER_BATCH) {
            // Process in batches for very large directories
            for (i in files.indices step MAX_FILES_PER_BATCH) {
                val endIndex = minOf(i + MAX_FILES_PER_BATCH, files.size)
                val batch = files.sliceArray(i until endIndex)
                processFileBatch(batch, fileInfos, recursive, includeHidden, maxDepth, currentDepth)
            }
            return
        }

        for (file in files) {
            // Skip hidden files if not including them
            if (!includeHidden && file.name.startsWith(".")) {
                continue
            }

            val fileInfo = WritableNativeMap().apply {
                putString("path", file.absolutePath)
                putString("name", file.name)
                putDouble("size", file.length().toDouble())
                putBoolean("isFile", file.isFile)
                putBoolean("isDirectory", file.isDirectory)
                putDouble("createdAt", file.lastModified().toDouble()) // Android doesn't provide creation time
                putDouble("modifiedAt", file.lastModified().toDouble())
            }

            fileInfos.add(fileInfo)

            // Recursively scan subdirectories if enabled
            if (recursive && file.isDirectory) {
                scanDirectory(file, fileInfos, recursive, includeHidden, maxDepth, currentDepth + 1)
            }
        }
    }

    private fun processFileBatch(
        files: Array<File>,
        fileInfos: MutableList<WritableMap>,
        recursive: Boolean,
        includeHidden: Boolean,
        maxDepth: Int,
        currentDepth: Int
    ) {
        for (file in files) {
            // Skip hidden files if not including them
            if (!includeHidden && file.name.startsWith(".")) {
                continue
            }

            val fileInfo = WritableNativeMap().apply {
                putString("path", file.absolutePath)
                putString("name", file.name)
                putDouble("size", file.length().toDouble())
                putBoolean("isFile", file.isFile)
                putBoolean("isDirectory", file.isDirectory)
                putDouble("createdAt", file.lastModified().toDouble()) // Android doesn't provide creation time
                putDouble("modifiedAt", file.lastModified().toDouble())
            }

            fileInfos.add(fileInfo)

            // Recursively scan subdirectories if enabled
            if (recursive && file.isDirectory) {
                scanDirectory(file, fileInfos, recursive, includeHidden, maxDepth, currentDepth + 1)
            }
        }
    }

    override fun exists(path: String, promise: Promise) {
        try {
            val cleanedPath = cleanPath(path)
            val file = File(cleanedPath)
            promise.resolve(file.exists())
        } catch (e: Exception) {
            promise.reject("UNKNOWN_ERROR", "Unexpected error: ${e.message}", e)
        }
    }

    override fun isFile(path: String, promise: Promise) {
        try {
            val cleanedPath = cleanPath(path)
            val file = File(cleanedPath)
            promise.resolve(file.exists() && file.isFile)
        } catch (e: Exception) {
            promise.reject("UNKNOWN_ERROR", "Unexpected error: ${e.message}", e)
        }
    }

    override fun isDirectory(path: String, promise: Promise) {
        try {
            val cleanedPath = cleanPath(path)
            val file = File(cleanedPath)
            promise.resolve(file.exists() && file.isDirectory)
        } catch (e: Exception) {
            promise.reject("UNKNOWN_ERROR", "Unexpected error: ${e.message}", e)
        }
    }
}
