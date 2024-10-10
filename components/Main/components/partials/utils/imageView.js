import { View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import React from "react";
import { useTheme } from "../../../../../contexts/theme";
import SafeAreaView from "./safe";
import * as MediaLibrary from "expo-media-library";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";

const ImageViewer = ({
  imageUri,
  setIsImageViewerOpen,
  isProfilePicture = false,
  isStory = false,
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

  //animation
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const onGestureEvent = (event) => {
    translateX.value = event.nativeEvent.translationX;
    translateY.value = event.nativeEvent.translationY;
  };

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === 5) {
      if (
        Math.abs(translateY.value) > 100 ||
        Math.abs(translateX.value) > 100
      ) {
        setIsImageViewerOpen(false);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View style={[styles.container,animatedStyle]}>
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
                contentFit={!isStory ? "contain" : "fit"}
                enableLiveTextInteraction={true}
                focusable={true}
              />
            )}
          </View>
        </SafeAreaView>
      </Animated.View>
    </PanGestureHandler>
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
    height: "100%",
    width: "100%",
    alignSelf: "center",
    borderRadius: 10,
  },
  container: {
    flex: 1,
  },
});
