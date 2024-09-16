import { Text, StyleSheet, Image } from "react-native";
import { useEffect } from "react";
import floatingBot from "./images/floatingBoot.gif";
import { useSocket } from "../../contexts/socketContext";
import SafeAreaView from "../Main/components/partials/utils/safe";
import { useTheme } from "../../contexts/theme";
import { StatusBar } from "expo-status-bar";

const Loading = ({ navigation }) => {
  const socket = useSocket();
  const {theme,background}=useTheme();
  useEffect(() => {
    if (socket.isAuth) {
      navigation.replace("homePage");
    } else if (!socket.isAuth && !socket.isLoading) {
      navigation.replace("authPage");
    }
  }, [socket.isAuth, socket.isLoading]);

  return (
    <SafeAreaView>
      <StatusBar
        style={theme === "dark" ? "light" : "dark"}
        backgroundColor={background}
      />
      <Image style={styles.Image} source={floatingBot} />
      <Text style={styles.textStyle}>Server is Loading...</Text>
    </SafeAreaView>
  );
};

export default Loading;

const styles = StyleSheet.create({
  Image: {
    height: 300,
    width: 300,
    alignSelf: "center",
    marginLeft: "20%",
  },
  textStyle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },
});
