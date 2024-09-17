import { View, StyleSheet, Image, TouchableOpacity, Modal } from "react-native";
import React from "react";
import { useTheme } from "../../../../contexts/theme";
import { useAuth } from "../../../../contexts/authContext";
import { LinearGradient } from "expo-linear-gradient";
import { useSocket } from "../../../../contexts/socketContext";
import ImageViewer from "./utils/imageView";

const Footer = ({ moveTo }) => {
  const { Icons, background } = useTheme();
  const { user, profilePicture, story } = useAuth();
  const { isConnected } = useSocket();
  const [showImage, setShowImage] = React.useState(false);
  return (
    <View style={styles.container(background)}>
      <TouchableOpacity onPress={() => moveTo("Stuff")}>
        <Image style={styles.Image()} source={Icons.stuff} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => moveTo("blogPage")}>
        <Image style={styles.Image()} source={Icons.blog} />
      </TouchableOpacity>
      <View>
        <TouchableOpacity
          disabled={!isConnected || !story}
          onPress={() => {
            setShowImage(true);
            setTimeout(() => setShowImage(false), 20000);
          }}
        >
          <LinearGradient
            colors={
              story
                ? [
                    "#FFC0CB",
                    "#90EE90",
                    "#32CD32",
                    "#228B22",
                    "#32CD32",
                    "#90EE90",
                  ]
                : ["transparent", "transparent"]
            }
            style={styles.circle(45)}
          >
            <View style={styles.circle(40,background)}>
            <Image
              style={styles.Image(true)}
              source={
                user
                  ? {
                      uri: profilePicture,
                    }
                  : Icons.chat
              }
            />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => moveTo("Settings")}>
        <Image style={styles.Image()} source={Icons.setting} />
      </TouchableOpacity>
      <Modal
        visible={showImage}
        transparent={true}
        animationType="fade"
        hardwareAccelerated={true}
        onRequestClose={() => setShowImage(false)}
      >
        <ImageViewer
          imageUri={story}
          setIsImageViewerOpen={setShowImage}
          isProfilePicture={true}
          isStory={true}
        />
      </Modal>
    </View>
  );
};



export default Footer;

const styles = StyleSheet.create({
  container: (color) => ({
    flex: 0.15,
    backgroundColor: color,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  }),
  Image: (round = false) => ({
    height: 40,
    width: 40,
    alignSelf: "center",
    borderRadius: round ? 20 : 0,
  }),
  circle: (r,bg="transparent") => ({
    height: r,
    width: r,
    borderRadius: r / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: bg,
  }),
});
