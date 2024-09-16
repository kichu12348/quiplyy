import { View, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import React from "react";
import { useTheme } from "../../../../../contexts/theme";
import SafeAreaView from "./safe";
import * as MediaLibrary from "expo-media-library";

const ImageViewer = ({
  imageUri,
  setIsImageViewerOpen,
  isProfilePicture = false,
}) => {
  const { Icons } = useTheme();

  async function saveImage() {
    if (isProfilePicture) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      const asset = await MediaLibrary.createAssetAsync(imageUri);
      await MediaLibrary.createAlbumAsync("quiplyy", asset, false);
    } else
      Alert.alert(
        "Permission Denied",
        "Please allow storage permission to save image"
      );
  }

  return (
    <SafeAreaView>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton()}
          onPress={() => setIsImageViewerOpen(false)}
        >
          <Image source={Icons.return} style={styles.backIcon} />
        </TouchableOpacity>
        {!isProfilePicture && (
          <TouchableOpacity style={styles.backButton()} onPress={saveImage}>
            <Image source={Icons.download} style={styles.backIcon} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.imageContainer}>
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default ImageViewer;

const styles = StyleSheet.create({
  header: {
    height: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  backButton: () => ({
    height: 40,
    width: 40,
  }),
  backIcon: {
    height: 40,
    width: 40,
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    height: "95%",
    width: "95%",
    alignSelf: "center",
    borderRadius: 10,
  },
});
