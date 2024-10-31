import { View, StyleSheet } from "react-native";
import { createStackNavigator,TransitionPresets} from "@react-navigation/stack";
import { useTheme } from "../../../../contexts/theme";
import Screen1 from "./Screen1";
import Screen2 from "./Screen2";

const Blog = () => {
  const { theme } = useTheme();
  const Stack = createStackNavigator();
  return (
    <View style={styles.container(theme)}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          ...TransitionPresets.SlideFromRightIOS
        }}
        initialRouteName="Blogs"
      >
        <Stack.Screen name="Blogs" component={Screen1} />
        <Stack.Screen name="Blog" component={Screen2} />
      </Stack.Navigator>
    </View>
  );
};

export default Blog;

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
  }),
});
