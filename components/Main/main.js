import { StyleSheet, View, Modal, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../contexts/theme";
import Auth from "../Auth/authPage";
import Home from "./components/Home";
import Loading from "../Auth/loadingPage";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import { usePineappleBan } from "../../contexts/pineabbleBanContext";
import { BlurView } from "expo-blur";

const Main = () => {
  const Stack = createStackNavigator();
  const theme = useTheme();
  const { isPineappleBanned } = usePineappleBan();

  return (
    <View style={styles.container}>
      <StatusBar
        style={theme.theme === "dark" ? "light" : "dark"}
        backgroundColor={theme.background}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          ...TransitionPresets.SlideFromRightIOS,
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
      <Modal
        visible={isPineappleBanned}
        transparent={true}
        animationType="slide"
        hardwareAccelerated={true}
      >
        <BlurView style={styles.modalContainer} intensity={100} tint="dark">
          <View style={styles.modalTextContainer}>
            <Text style={styles.modalText}>
              You are banned for 5 minutes 😼
              {"\n\n"}
              Should not have used pineapple 🍍 word more than 10 times!!!!
            </Text>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

export default Main;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalText: {
    color: "rgba(255,0,0,0.9)",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalTextContainer: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: "80%",
  },
});
