import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { decode } from "base64-arraybuffer";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

async function getImages() {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (result.canceled) {
      return null;
    }
    if (result.assets[0].mimeType === "image/gif") {
      return result.assets[0].uri;
    }
    const fileUri = result.assets[0].uri;
    const manipResult = await manipulateAsync(fileUri, [], {
      compress: 0.5,
      format: SaveFormat.JPEG,
    });
    return manipResult.uri;
  } catch (error) {
    return null;
  }
}

async function uploadImageInChunks(fileUri, supabase) {
  const fileName = fileUri.split("/").pop();
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const { data, error } = await supabase.storage
    .from("images")
    .upload(fileName, decode(base64), {
      contentType: `image/${fileName.split(".").pop()}`,
      upsert: false,
    });
  if (error) {
    return null;
  }
  return {
    uri: fileName,
    localFileUri: fileUri,
  };
}

export async function uploadImage(endPoint) {
  if (!endPoint) return null;
  const fileUri = await getImages();
  if (!fileUri) return null;
  const res = await uploadImageInChunks(fileUri, endPoint);
  return res;
}

export async function downloadFile(fileName) {
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  const downloadUrl = `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/images/${fileName}`;

  try {
    const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri);
    if (downloadResult.status === 200) {
      return {
        success: true,
        uri: fileUri,
      };
    }
    return {
      success: false,
      uri: null,
    };
  } catch (error) {
    return {
      success: false,
      uri: null,
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
  const destinationUri = `${FileSystem.documentDirectory}${sourceUri
    .split("/")
    .pop()}`;
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
