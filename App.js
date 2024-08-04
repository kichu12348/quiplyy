import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider} from "react-native-safe-area-context";
import { ThemeProvider } from "./contexts/theme";
import { SocketProvider } from "./contexts/socketContext";
import { MessagerProvider } from "./contexts/messagerContext";
import { SqlProvider } from "./contexts/sqlContext";
import { AuthProvider } from "./contexts/authContext";
import { BlogProvider } from "./contexts/BlogContext";
import Main from "./components/Main/main";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";

enableScreens();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <NavigationContainer>
          <ThemeProvider>
            <SocketProvider>
              <AuthProvider>
                <SqlProvider>
                  <MessagerProvider>
                    <BlogProvider>
                      <Main />
                    </BlogProvider>
                  </MessagerProvider>
                </SqlProvider>
              </AuthProvider>
            </SocketProvider>
          </ThemeProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
