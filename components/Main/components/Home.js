import { StyleSheet} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStackNavigator ,TransitionPresets} from "@react-navigation/stack";
import { useEffect } from "react";
import Chats from "./partials/chats";
import Stuff from "./partials/stuff";
import Blog from "./partials/blogs";
import Settings from "./partials/settings";
import SingleChat from "./partials/singleChat";
import ChessJs from "./partials/chess";
import AiChat from "./partials/aiChat";
import { useTheme } from "../../../contexts/theme";
import { useAuth } from "../../../contexts/authContext";
import { useSocket } from "../../../contexts/socketContext";


const Home = ({navigation}) => {
  const Stack = createStackNavigator();

  const theme = useTheme();
  const auth = useAuth();
  const socket = useSocket()
  useEffect(() => {
    if (!socket.isAuth && !socket.isLoading) {
      navigation.replace("authPage");
    }
    else if(!socket.isAuth && socket.isLoading){
      navigation.replace("LoadingPage");
    }
  },[auth.token,socket.isAuth]);

  

  return (
    <SafeAreaView style={styles.container(theme)}>
      <Stack.Navigator 
        initialRouteName="Chats"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          ...TransitionPresets.SlideFromRightIOS
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
        <Stack.Screen
          name="ChessJs"
          component={ChessJs}
        />
        <Stack.Screen
          name="AiChat"
          component={AiChat}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    backgroundColor: theme.background,
  }),
});
