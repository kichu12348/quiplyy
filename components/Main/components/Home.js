import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect } from "react";
import Chats from "./partials/chats";
import Stuff from "./partials/stuff";
import Settings from "./partials/settings";
import SingleChat from "./partials/singleChat";
import { useTheme } from "../../../contexts/theme";
import { useAuth } from "../../../contexts/authContext";

const Home = ({navigation}) => {
  const Stack = createStackNavigator();

  const theme = useTheme();
  const auth = useAuth();
  useEffect(() => {
    if (!auth.user) {
      navigation.replace("authPage");
    }
  },[auth.token]);

  

  return (
    <SafeAreaView style={styles.container(theme.theme)}>
      <Stack.Navigator>
        <Stack.Screen
          name="Chats"
          component={Chats}
          options={{
            header: () => null,
          }}
        />
        <Stack.Screen
          name="Stuff"
          component={Stuff}
          options={{
            header: () => null,
          }}
        />
        <Stack.Screen
          name="Settings"
          component={Settings}
          options={{
            header: () => null,
          }}
        />
        <Stack.Screen
          name="SingleChat"
          component={SingleChat}
          options={{
            header: () => null,
          }}
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
