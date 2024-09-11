import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Switch,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useState } from "react";
import { useTheme } from "../../../../contexts/theme";
import { useAuth } from "../../../../contexts/authContext";
import { useSql } from "../../../../contexts/sqlContext";
import * as Updates from "expo-updates";
import { useSocket } from "../../../../contexts/socketContext";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";
import ImageViewer from "./utils/imageView";

const Settings = ({ navigation }) => {
  const theme = useTheme();
  const auth = useAuth();
  const sql = useSql();
  const socket = useSocket();

  const [modalVisible, setModalVisible] = useState(false);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [uri, setUri] = useState(null);

  const checkForUpdate = async () => {
    if (!socket.isConnected) return;
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
        Alert.alert("Update Available", "Please Restart the App");
      } else {
        Alert.alert("No Update Available");
      }
    } catch (error) {
      Alert.alert("Nuh  uh!!!");
    }
  };

  const getImage = async () => {
    try {
      const { assets } = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (assets.canceled) return;
      const file = assets[0];
      if (file.mimeType === "image/gif") return;
      const uri = file.uri;
      const manipResult = await manipulateAsync(uri, [], {
        compress: 0.5,
        format: SaveFormat.PNG,
      });
      return manipResult.uri;
    } catch (error) {
      return null;
    }
  };

  const uploadProfilePicture = async () => {
    const uri = await getImage();
    if (!uri) return;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { data, error } = await socket.supabase.storage
      .from("profilePictures")
      .upload(`${auth?.user?.username}.png`, decode(base64), {
        contentType: "image/png",
        upsert: true,
      });
    if (error) return Alert.alert("Error", "Failed to upload profile picture");
    const newUri = await auth.getProfilePicture(auth.user.username);
    auth.setProfilePicture(newUri);
  };

  const Terms = () => {
    return (
      <SafeAreaView>
        <View style={styles.header()}>
          <TouchableOpacity
            style={styles.Image(10)}
            onPress={() => setModalVisible(false)}
          >
            <Image source={theme.Icons.return} style={styles.Image(0)} />
          </TouchableOpacity>
          <Text
            style={styles.text(theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D")}
          >
            Terms and Conditions
          </Text>
        </View>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={styles.text(
              theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D",
              15,
              10,
              10,
              500
            )}
          >
            1. By using this app, you agree to drop your phone every now and
            then just to remind yourself how precious it is. We accept no
            responsibility for cracked screens, but we’ll offer a virtual hug!
            🤗📱{"\n\n"}
            2. We promise to keep your messages private, just like your secret
            stash of snacks hidden from your roommates. We will, however, be
            curious about how you use emojis. 🤫🍕{"\n\n"}
            3. You agree not to send any messages that would make your grandma
            question your taste in humor💀. This app endorses any form of Dad
            jokes. 😃{"\n\n"}
            4. We reserve the right to temporarily ban you from the app if you
            send more than 100 consecutive messages about pineapple on pizza.
            It’s nothing personal, it’s just for the sake of humanity yk. 🍍🍕🚫
            {"\n\n"}
            5. By agreeing to these terms, you acknowledge that your typing
            speed might be scrutinized by our imaginary speed police. Improve at
            your own risk; no actual fines will be imposed. 🚓⌨️💨{"\n\n"}
            6. Any attempts to use our app for world domination ⚠️ will be met
            with a gentle reminder that your true calling might just be in
            sending funny cat memes. We’re all about balance here. 😺🌍{"\n\n"}
            7. You agree to use our app to spread positivity, love, and the
            occasional GIF of a judgemental car. Negative vibes will be met with
            an infinite loop of Cringeeeeee. 💖🚗😝{"\n\n"}
            8. If you accidentally send a message to the wrong person, you’ll
            have to do the digital equivalent of a cringe worthy dance. We
            promise not to judge much. 💃🤦‍♂️{"\n\n"}
            9. If you find a typo in our terms, you get a virtual high-five and
            the honor of knowing you’ve read them more closely than anyone else.
            🔍✋🎉{"\n\n"}
            10. By using this app, you agree to embrace random bursts of
            inspiration and creativity. If a message inspires you to write a
            poem or create a doodle, consider it a bonus feature of our app!
            🎨🖋️
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  };

  return (
    <SafeAreaView>
      <View style={styles.header()}>
        <TouchableOpacity
          style={styles.Image(10)}
          onPress={() => navigation.goBack()}
        >
          <Image source={theme.Icons.return} style={styles.Image(0)} />
        </TouchableOpacity>

        <Text
          style={styles.text(theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D")}
        >
          Settings
        </Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.center}>
          <View
            style={styles.middle("space-between", "row", "center", 20, theme)}
          >
            <Text
              style={styles.text(
                theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D"
              )}
            >
              {auth.user ? auth.user.username : "User"}
            </Text>
            <TouchableOpacity
              style={styles.center}
              onPress={() => {
                setImageViewerOpen(true);
                setUri(auth.profilePicture);
              }}
            >
              <Image
                source={
                  auth.user
                    ? {
                        uri: auth.profilePicture,
                      }
                    : theme.Icons.setting
                }
                style={styles.Image(10, 20)}
              />
            </TouchableOpacity>
          </View>
          <View
            style={styles.middle(
              "space-between",
              "row",
              "flex-start",
              20,
              theme
            )}
          >
            <Text
              style={styles.text(
                theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D"
              )}
            >
              Dark Mode
            </Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: "rgba(0,255,0,0.8)" }}
              thumbColor={"#E0E0E0"}
              value={theme.theme === "dark"}
              onValueChange={() =>
                theme.themeSetting(theme.theme === "dark" ? "light" : "dark")
              }
            />
          </View>
          <View
            style={styles.middle("space-between", "row", "center", 20, theme)}
          >
            <Text
              style={styles.text(
                theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D"
              )}
            >
              Profile Picture
            </Text>
            <TouchableOpacity
              style={styles.center}
              onPress={() => uploadProfilePicture()}
            >
              <Image source={theme.Icons.upload} style={styles.Image()} />
            </TouchableOpacity>
          </View>
          <View
            style={styles.middle(
              "space-between",
              "column",
              "flex-start",
              20,
              theme
            )}
          >
            <Text
              style={styles.text(
                theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D"
              )}
            >
              3D Background
            </Text>
            <ScrollView
              style={styles.container()}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            >
              {["Cheese", "Pineapple", "Waffle", "Pizza"].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.stuffContainer}
                  onPress={() => {
                    theme.chatBackgroundModel(item);
                  }}
                >
                  <Text
                    style={styles.text(
                      theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D",
                      20,
                      10,
                      10
                    )}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.middle("center", "column", "center", 0, theme)}>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.rowBtn(theme.theme)}
                onPress={() => checkForUpdate()}
              >
                <Text style={styles.text("white")}>Check For Update</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.centerDiv}>
              <TouchableOpacity
                style={styles.button(theme.theme)}
                onPress={() => {
                  auth.logOut();
                  sql.dropContactsDB();
                }}
              >
                <Text style={styles.text("white")}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="slide"
          hardwareAccelerated={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <Terms />
        </Modal>
        <Modal
          transparent={true}
          visible={isImageViewerOpen}
          animationType="slide"
          hardwareAccelerated={true}
          onRequestClose={() => setImageViewerOpen(false)}
        >
          <ImageViewer imageUri={uri} setIsImageViewerOpen={setImageViewerOpen} />
        </Modal>
        <View style={styles.connectionDet}>
          <Text
            style={styles.text(
              theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D",
              15
            )}
          >
            v 1.10.0
          </Text>
          <Text
            style={styles.text(
              theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D",
              15
            )}
          >
            Made with ❤️ by Kichu
          </Text>
          <TouchableOpacity
            style={styles.center}
            onPress={() => {
              setModalVisible(true);
            }}
          >
            <Text
              style={styles.text(
                theme.theme === "dark"
                  ? "rgba(0,250,255,0.8)"
                  : "rgba(0,200,255,1)",
                15
              )}
            >
              Terms and Conditions 😃
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: () => ({
    flex: 1,
  }),
  scrollView: {
    flex: 1,
  },
  text: (color, fts = 20, mh = 0, mt = 0, w = "bold") => ({
    color: color,
    fontSize: fts,
    fontWeight: w,
    alignSelf: "center",
    marginHorizontal: mh,
    marginTop: mt,
  }),
  header: () => ({
    height: 50,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 20,
  }),
  Image: (
    marginR = 0,
    marginL = 0,
    borderRadius = 20,
    height = 40,
    width = 40
  ) => ({
    height: height,
    width: width,
    marginRight: marginR,
    marginLeft: marginL,
    borderRadius: borderRadius,
  }),
  middle: (
    justifyContent = "flex-end",
    flexDirection = "row",
    alignItems = "center",
    marginTop = 20,
    theme
  ) => ({
    flexDirection: flexDirection,
    justifyContent: justifyContent,
    alignItems: alignItems,
    backgroundColor: "transparent",
    marginTop: 20,
    width: "90%",
    minHeight: 50,
    padding: 15,
    backgroundColor: theme.theme === "dark" ? "#212121" : "#e0e0e0",
    borderRadius: 25,
  }),
  button: (theme, opacity = 1) => ({
    backgroundColor:
      theme === "dark" ? "rgba(198,0,198,1)" : "rgba(0,255,0,0.8)",
    height: 50,
    width: "60%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 0,
    marginTop: 15,
    opacity: opacity,
  }),
  centerDiv: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  TextInput: (theme, state) => ({
    flex: 1,
    height: 50,
    backgroundColor: state ? theme.chatColor.sender : theme.chatColor.receiver,
    borderRadius: 25,
    padding: 10,
    margin: 10,
    marginTop: 20,
    color: "white",
    fontWeight: "bold",
  }),
  body: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBtn: (theme) => ({
    backgroundColor:
      theme === "dark" ? "rgba(198,0,198,1)" : "rgba(0,255,0,0.8)",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    marginHorizontal: 0,
    padding: 10,
    minWidth: "10%",
  }),

  connectionDet: {
    minHeight: 100,
    flexDirection: "column",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
});
