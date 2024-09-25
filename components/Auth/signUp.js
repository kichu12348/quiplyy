import {
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
} from "react-native";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../contexts/authContext";
import SafeAreaView from "../Main/components/partials/utils/safe";
import { useTheme } from "../../contexts/theme";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { useSocket } from "../../contexts/socketContext";

export default function SignUp({ navigation }) {
  const Auth = useAuth();
  const { isConnected, supabase, socket } = useSocket();
  const { theme, textInputColor, Icons, background } = useTheme();

  const handleMovePage = () => {
    navigation.navigate("login");
  };

  //states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState(null);
  const [signingUp, setSigningUp] = useState(false);

  const getImage = async () => {
    try {
      const { assets } = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (assets.canceled) return;
      const file = assets[0];
      if (file.mimeType === "image/gif")
        return Alert.alert("Gif not supported");
      const uri = file.uri;
      const manipResult = await manipulateAsync(uri, [], {
        compress: 0.5,
        format: SaveFormat.JPEG,
      });
      return manipResult.uri;
    } catch (error) {
      return null;
    }
  };

  const uploadProfilePicture = async () => {
    if (!isConnected || !socket) return;
    const uri = await getImage();
    setImage(uri);
    if (!uri) return null;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { data, error } = await supabase.storage
      .from("profilePictures")
      .upload(`${username}.${uri.split(".").pop()}`, decode(base64), {
        contentType: "image/png",
        upsert: true,
      });
    if (error) return Alert.alert("Error: Failed to upload profile picture");
    Auth.setProfilePicture(uri);
    return uri;
  };

  const handleSignUp = async () => {
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
    setSigningUp(true);
    const imageUri = await uploadProfilePicture(image);
    if (!imageUri) {
      Alert.alert("Please Select an Image");
      setSigningUp(false);
      return;
    }
    await Auth.signup(username.trim(), password.trim(), imageUri);
    setSigningUp(false);
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
          readOnly={image !== null || signingUp}
          placeholder="username..."
          placeholderTextColor={theme === "dark" ? "#E0E0E0" : "#2D2D2D"}
          value={username}
          onChangeText={(text) => setUsername(text.trim())}
        />
        <TextInput
          style={styles.TextInput(textInputColor, theme)}
          placeholder="password.."
          value={password}
          readOnly={image !== null || signingUp}
          onChangeText={(text) => setPassword(text.trim())}
          placeholderTextColor={theme === "dark" ? "#E0E0E0" : "#2D2D2D"}
          secureTextEntry
          onSubmitEditing={handleSignUp}
        />
        <TouchableOpacity
          style={styles.row}
          onPress={handleMovePage}
          disabled={signingUp}
        >
          <Text
            style={styles.textStyle(theme === "dark" ? "#E0E0E0" : "#2D2D2D")}
          >
            Already registered ?
          </Text>
          <Text
            style={styles.textStyle(
              theme === "dark" ? "rgba(198,0,198,1)" : "rgba(0,255,0,0.8)"
            )}
          >
            {"  "}Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button(theme)}
          onPress={handleSignUp}
          disabled={signingUp}
        >
          <Text style={styles.textStyle()}>Sign up</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
