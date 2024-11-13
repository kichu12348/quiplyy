import { View, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { useTheme } from "../../../../contexts/theme";
import { useAuth } from "../../../../contexts/authContext";
import { LinearGradient } from "expo-linear-gradient";
import { useSocket } from "../../../../contexts/socketContext";
import CustomModal from "./utils/customModal";
import { Image } from "expo-image";
import Icon from "./utils/icons";

const Footer = ({ moveTo }) => {
  const { background } = useTheme();
  const { user, profilePicture, story } = useAuth();
  const { isConnected } = useSocket();
  const [showImage, setShowImage] = React.useState(false);
  return (
    <View style={styles.container(background)}>
      <TouchableOpacity onPress={() => moveTo("Stuff")}>
        <Icon name="Shovel" size={40} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => moveTo("blogPage")}>
        <Icon name="Share2" size={40} />
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
                source={{
                  uri: profilePicture,
                }}
                cachePolicy={"none"}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => moveTo("Settings")}>
        <Icon name="Settings" size={40} />
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
