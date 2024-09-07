import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import { useTheme } from "../../../../../contexts/theme";
import SafeAreaView from "./safe";

const ImageViewer = ({ imageUri, setIsImageViewerOpen }) => {
  const { Icons } = useTheme();
  return (
    <SafeAreaView>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton()}
          onPress={() => setIsImageViewerOpen(false)}
        >
          <Image source={Icons.return} style={styles.backIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.imageContainer}>
        {imageUri&&<Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
        />}
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
    marginTop: 20,
  },
  backButton: (marginR = 0) => ({
    marginLeft: 10,
    marginRight: marginR,
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
    image:{
        height: "95%",
        width: "95%",
        alignSelf: "center",
        borderRadius: 10,
    }
});
