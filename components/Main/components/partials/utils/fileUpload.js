import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';


async function getImages() {
    try {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [4, 3],
            quality: 0.5,
        });
        if (result.canceled) {
            return null;
        }
        if (!result.canceled) {
            return result.assets[0].uri;
        }  
    } catch (error) {
        return null;
    }
}

async function uploadImageInChunks(fileUri, endPoint) {
    const chunkSize = 1024 * 1024; // 1MB per chunk
    const maxFileSize = 1024*1024*5 // 5 MB
    
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const fileSize = fileInfo.size;

    if (fileSize > maxFileSize) {
        return {
            success: false,
            uri: null,
            localFileUri: null,
            err: 'File size is too large. Please select a file less than 8MB'
        };
    }
    const totalChunks = Math.ceil(fileSize / chunkSize);
    const fileName = fileUri.split('/').pop();

    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, fileSize);
        const chunk = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
            position: start,
            length: end - start
        });

        const { done, success, uri } = await uploadChunk(chunk, i, totalChunks, fileName, endPoint);

        if (!success && !done) {// teeny weeny error causing pitch
            await deleteFileFromServer(fileName, endPoint);
            return {
                success: false,
                uri: null,
                localFileUri: null,
                err: 'Failed to upload file'
            };
        }

        if (done && i === totalChunks - 1) {
            return {
                success: true,
                uri: uri,
                localFileUri: fileUri,
                err: null
            };
        }
    }
}

async function uploadChunk(chunk, chunkIdx, totalChunks, fileName, endPoint) {
  try {
      const res = await axios.post(`${endPoint}/message/uploadFile`, {
          chunk,
          chunkIdx,
          totalChunks,
          fileName
      });
      return {
          success: res.data.success,
          done: res.data.done,
          uri: res.data.uri,
      };
  } catch (e) {
      return {
          success: false,
          done: false,
          uri: null
      };
  }
}


export async function uploadImage(endPoint) {
    if (!endPoint) return {
        success: false,
        uri: null
    };

    const fileUri = await getImages();
    if (!fileUri) return{
        success: false,
        uri: null
    };

    const res = await uploadImageInChunks(fileUri, endPoint);
    return res;
}


export async function downloadFile(fileName, endPoint) {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    const downloadUrl = `${endPoint}/message/downloadFile?fileName=${encodeURIComponent(fileName)}`;
  
    try {
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          md5: false,
          headers: {
            // stuufff ill think about later
          }
        }
      );
  
      if (downloadResult.status === 200) {
        return {
          success: true,
          uri: fileUri
        };
      } else {
        return {
          success: false,
          uri: null
        };
      }
    } catch (error) {
      return {
        success: false,
        uri: null
      };
    }
  }


export async function deleteFile(fileName) {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
       return true;
      } else {
        return true;
      }
    } catch (error) {
        return false;
    }
  }


export async function copyFileToDocumentDirectory(sourceUri) {
    if (!sourceUri) return null;
    const destinationUri = `${FileSystem.documentDirectory}${sourceUri.split('/').pop()}`;
    try {
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri,
      });
      return destinationUri;
    } catch (error) {
      return null;
    }
  }


async function deleteFileFromServer(fileName,endPoint) {
    try {
        const res = await axios.post(`${endPoint}/message/deleteFileErr`, {
            fileName
        });
        return res.data.success;
    } catch (error) {
        return false;
    }
}


