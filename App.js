import { StyleSheet, View } from "react-native";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./contexts/theme";
import { SocketProvider } from "./contexts/socketContext";
import { MessagerProvider } from "./contexts/messagerContext";
import { SqlProvider } from "./contexts/sqlContext";
import { AuthProvider } from "./contexts/authContext";
import Main from "./components/Main/main";
import "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
enableScreens();

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <NavigationContainer>
          <ThemeProvider>
            <SocketProvider>
              <AuthProvider>
                <SqlProvider>
                  <MessagerProvider>
                    <Main />
                  </MessagerProvider>
                </SqlProvider>
              </AuthProvider>
            </SocketProvider>
          </ThemeProvider>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
