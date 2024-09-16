import {
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
} from "react-native";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../contexts/authContext";
import { useTheme } from "../../contexts/theme";
import SafeAreaView from "../Main/components/partials/utils/safe";

const Login = ({ navigation }) => {
  const handleMovePage = () => {
    navigation.navigate("signup");
  };

  //states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const Auth = useAuth();
  const { theme, textInputColor, Icons, background } = useTheme();

  const handleLogin = () => {
    if (
      username === "" ||
      password === "" ||
      username === undefined ||
      password === undefined ||
      username.trim() === "" ||
      password.trim() === "" ||
      username.length < 4 ||
      password.length < 4
    ) {
      Alert.alert("Fill the fields");
      return;
    }
    Auth.login(username.trim(), password.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        style={theme === "dark" ? "light" : "dark"}
        backgroundColor={background}
      />
      <KeyboardAvoidingView
        style={styles.KeyboardAvoidingView("center")}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? -150 : 0}
      >
        <Image source={Icons.logo} style={styles.Image} />
        <TextInput
          style={styles.TextInput(textInputColor, theme)}
          placeholder="username..."
          placeholderTextColor={theme === "dark" ? "#E0E0E0" : "#2D2D2D"}
          value={username}
          onChangeText={(text) => setUsername(text)}
        />
        <TextInput
          style={styles.TextInput(textInputColor, theme)}
          placeholder="password.."
          value={password}
          onChangeText={(text) => setPassword(text)}
          placeholderTextColor={theme === "dark" ? "#E0E0E0" : "#2D2D2D"}
          secureTextEntry
          onSubmitEditing={handleLogin}
        />
        <TouchableOpacity style={styles.row} onPress={handleMovePage}>
          <Text
            style={styles.textStyle(theme === "dark" ? "#E0E0E0" : "#2D2D2D")}
          >
            New user ?
          </Text>
          <Text
            style={styles.textStyle(
              theme === "dark" ? "rgba(198,0,198,1)" : "rgba(0,255,0,0.8)"
            )}
          >
            {"  "}Sign Up
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button(theme)} onPress={handleLogin}>
          <Text style={styles.textStyle()}>Login</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textStyle: (color = "white", marginT = 0, marginB = 0) => ({
    color: color,
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: marginB,
    marginTop: marginT,
  }),
  KeyboardAvoidingView: (justifyContent) => ({
    flex: 1,
    flexDirection: "column",
    justifyContent: justifyContent,
    alignItems: "center",
  }),
  TextInput: (c, theme) => ({
    width: "80%",
    height: 50,
    backgroundColor: c.color,
    padding: 10,
    borderRadius: 20,
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 10,
    color: theme === "dark" ? "#E0E0E0" : "#2D2D2D",
  }),
  button: (theme) => ({
    height: 50,
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    backgroundColor:
      theme === "dark" ? "rgba(198,0,198,1)" : "rgba(0,255,0,0.8)",
    marginBottom: 10,
  }),
  Image: {
    height: 60,
    width: 60,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
});
