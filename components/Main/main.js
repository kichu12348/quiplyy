import { StyleSheet, View } from "react-native";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useTheme } from "../../contexts/theme";
import Auth from "../Auth/authPage";
import Home from "./components/Home";
import Loading from "../Auth/loadingPage";
import { createStackNavigator } from "@react-navigation/stack";

const Main = () => {

  const {
    isUpdateAvailable,
    isUpdatePending
  } = Updates.useUpdates();

  useEffect(() => {
    if (isUpdateAvailable) {
      Updates.reloadAsync();
    }
  },[isUpdatePending]);



  useEffect(()=>{
    Updates.checkForUpdateAsync()
    Updates.fetchUpdateAsync();
  },[])





  const Stack = createStackNavigator();
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <StatusBar
        style={theme.theme === "dark" ? "light" : "dark"}
        backgroundColor={theme.theme === "dark" ? "black" : "white"}
        translucent
      />
      <Stack.Navigator>
        <Stack.Screen
          name="LoadingPage"
          component={Loading}
          options={{
            header: () => null,
          }}
        />
        {/* hmm intresing code i have written 🙂 */}
        <Stack.Screen
          name="homePage"
          component={Home}
          options={{
            header: () => null,
          }}
        />

        <Stack.Screen
          name="authPage"
          component={Auth}
          options={{
            header: () => null,
          }}
        />
      </Stack.Navigator>
    </View>
  );
};

export default Main;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
