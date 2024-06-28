import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../contexts/theme";
import Auth from "../Auth/authPage";
import Home from "./components/Home";
import Loading from "../Auth/loadingPage";
import { createStackNavigator,TransitionPresets } from "@react-navigation/stack";

const Main = () => {
  const Stack = createStackNavigator();
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <StatusBar
        style={theme.theme === "dark" ? "light" : "dark"}
        backgroundColor={theme.theme === "dark" ? "black" : "white"}
        translucent={true}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          ...TransitionPresets.SlideFromRightIOS
        }}
      >
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
