import { Text, StyleSheet, View, Image } from "react-native";
import { useEffect } from "react";
import floatingBot from "./images/floatingBoot.gif";
import { useSocket } from "../../contexts/socketContext";

const Loading = ({ navigation }) => {
  const socket = useSocket();
  useEffect(() => {
    if (socket.isAuth) {
      navigation.replace("homePage");
    } else if (!socket.isAuth && !socket.isLoading) {
      navigation.replace("authPage");
    }
  }, [socket.isAuth, socket.isLoading]);

  return (
    <View style={styles.container}>
      <Image style={styles.Image} source={floatingBot} />
      <Text style={styles.textStyle}>Server is Loading...</Text>
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
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
