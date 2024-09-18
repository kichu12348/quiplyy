import { View, StyleSheet, Image, TouchableOpacity, Modal } from "react-native";
import React from "react";
import { useTheme } from "../../../../contexts/theme";
import { useAuth } from "../../../../contexts/authContext";
import { LinearGradient } from "expo-linear-gradient";
import { useSocket } from "../../../../contexts/socketContext";
import CustomModal from "./utils/customModal";

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
          }}
        >
          <LinearGradient
            colors={
              story
                ? [
                    "#FF8C00" /* Dark Orange */,
                    "#FFB600" /* Bright Yellow */,
                    "#FF5733" /* Fiery Red-Orange */,
                    "#C70039" /* Dark Red */,
                    "#900C3F" /* Deep Magenta */,
                    "#581845" /* Dark Purple */,
                  ]
                : ["transparent", "transparent"]
            }
            style={styles.circle(45)}
          >
            <View style={styles.circle(40, background)}>
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
      <CustomModal
        visible={showImage}
        onRequestClose={() => setShowImage(false)}
        ImageUri={story}
      />
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
  circle: (r, bg = "transparent") => ({
    height: r,
    width: r,
    borderRadius: r / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: bg,
  }),
});
