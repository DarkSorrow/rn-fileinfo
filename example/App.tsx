import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import RnFileinfo, { getFileInfo, getDirectoryInfo, exists, isFile, isDirectory } from '@novastera-oss/rn-fileinfo';

interface FileInfo {
  path: string;
  name: string;
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  createdAt: number;
  modifiedAt: number;
}

const App = (): React.JSX.Element => {
  const [path, setPath] = useState('/');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const formatFileInfo = (info: FileInfo): string => {
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp: number): string => {
      return new Date(timestamp).toLocaleString();
    };

    return `
Path: ${info.path}
Name: ${info.name}
Size: ${formatBytes(info.size)}
Type: ${info.isFile ? 'File' : 'Directory'}
Created: ${formatDate(info.createdAt)}
Modified: ${formatDate(info.modifiedAt)}
`;
  };

  const handleGetFileInfo = async () => {
    if (!path.trim()) {
      Alert.alert('Error', 'Please enter a path');
      return;
    }

    setLoading(true);
    try {
      const info = await getFileInfo(path);
      setResult(formatFileInfo(info));
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDirectoryInfo = async () => {
    if (!path.trim()) {
      Alert.alert('Error', 'Please enter a path');
      return;
    }

    setLoading(true);
    try {
      const files = await getDirectoryInfo(path, { recursive: false, includeHidden: false });
      let resultText = `Found ${files.length} items:\n\n`;
      
      files.forEach((file, index) => {
        resultText += `${index + 1}. ${file.name} (${file.isFile ? 'File' : 'Directory'})\n`;
        if (file.isFile) {
          const sizeKB = Math.round(file.size / 1024);
          resultText += `   Size: ${sizeKB} KB\n`;
        }
        resultText += `   Modified: ${new Date(file.modifiedAt).toLocaleDateString()}\n\n`;
      });
      
      setResult(resultText);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckExists = async () => {
    if (!path.trim()) {
      Alert.alert('Error', 'Please enter a path');
      return;
    }

    setLoading(true);
    try {
      const pathExists = await exists(path);
      setResult(`Path exists: ${pathExists ? 'Yes' : 'No'}`);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIsFile = async () => {
    if (!path.trim()) {
      Alert.alert('Error', 'Please enter a path');
      return;
    }

    setLoading(true);
    try {
      const isAFile = await isFile(path);
      setResult(`Is file: ${isAFile ? 'Yes' : 'No'}`);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIsDirectory = async () => {
    if (!path.trim()) {
      Alert.alert('Error', 'Please enter a path');
      return;
    }

    setLoading(true);
    try {
      const isADirectory = await isDirectory(path);
      setResult(`Is directory: ${isADirectory ? 'Yes' : 'No'}`);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>@novastera-oss/rn-fileinfo</Text>
          <Text style={styles.subtitle}>File Information Demo</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter file or directory path:</Text>
          <TextInput
            style={styles.input}
            value={path}
            onChangeText={setPath}
            placeholder="/path/to/file/or/directory"
            placeholderTextColor="#6c757d"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleGetFileInfo}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Get File Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleGetDirectoryInfo}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Get Directory Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={handleCheckExists}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Check Exists</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={handleCheckIsFile}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Is File?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={handleCheckIsDirectory}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Is Directory?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearResult}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Clear Result</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {result ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Result:</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ) : null}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Example Paths:</Text>
          <Text style={styles.infoText}>• / (root directory)</Text>
          <Text style={styles.infoText}>• /Users (user directory)</Text>
          <Text style={styles.infoText}>• /Applications (applications directory)</Text>
          <Text style={styles.infoText}>• /System/Library (system library)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  inputContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#212529',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  secondaryButton: {
    backgroundColor: '#28a745',
  },
  tertiaryButton: {
    backgroundColor: '#6c757d',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  resultContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#495057',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
});

export default App;
