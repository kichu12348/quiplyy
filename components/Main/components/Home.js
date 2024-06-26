import { StyleSheet, SafeAreaView } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect } from "react";
import Chats from "./partials/chats";
import Stuff from "./partials/stuff";
import Blog from "./partials/blogs";
import Settings from "./partials/settings";
import SingleChat from "./partials/singleChat";
import { useTheme } from "../../../contexts/theme";
import { useAuth } from "../../../contexts/authContext";
import { useSocket } from "../../../contexts/socketContext";


const Home = ({navigation}) => {
  const Stack = createStackNavigator();

  const theme = useTheme();
  const auth = useAuth();
  const socket = useSocket()
  useEffect(() => {
    if (!socket.isAuth) {
      navigation.replace("authPage");
    }
  },[auth.token,socket.isAuth]);

  

  return (
    <SafeAreaView style={styles.container(theme.theme)}>
      <Stack.Navigator 
        initialRouteName="Chats"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Chats"
          component={Chats}
        />
        <Stack.Screen
          name="Stuff"
          component={Stuff}
        />
        <Stack.Screen
          name="Settings"
          component={Settings}
        />
        <Stack.Screen
          name="SingleChat"
          component={SingleChat}
        />
        <Stack.Screen
          name="blogPage"
          component={Blog}
          />
      </Stack.Navigator>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    backgroundColor: theme === "dark" ? "black" : "white",
  }),
});
