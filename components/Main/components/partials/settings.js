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
  TextInput,
  Dimensions,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useEffect, useState } from "react";
import { useTheme } from "../../../../contexts/theme";
import { useAuth } from "../../../../contexts/authContext";
import { useSql } from "../../../../contexts/sqlContext";
import * as Updates from "expo-updates";
import { useSocket } from "../../../../contexts/socketContext";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LongPressComponent from "./utils/longPress";
import { decode } from "base64-arraybuffer";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import ImageViewer from "./utils/imageView";

const Settings = ({ navigation }) => {
  const theme = useTheme();
  const auth = useAuth();
  const sql = useSql();
  const socket = useSocket();
  const { width } = Dimensions.get("window");

  const [modalVisible, setModalVisible] = useState(false);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [bio, setBio] = useState("");

  const checkForUpdate = async () => {
    if (!socket.isConnected) return;
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert("Update Available 😃", "Restarting the App");
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } else {
        Alert.alert("sedly no Update Available 😔");
      }
    } catch (error) {
      Alert.alert(
        "Nuh  uh!!! 😼",
        `
       error: ${error.message}`
      );
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
        format: SaveFormat.JPEG,
      });
      return manipResult.uri;
    } catch (error) {
      return null;
    }
  };

  const uploadProfilePicture = async (state) => {
    if (!state || !socket.isConnected) return;
    const uri = await getImage();
    if (!uri) return;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { data, error } = await socket.supabase.storage
      .from("profilePictures")
      .upload(
        `${auth?.user?.username}.${uri.split(".").pop()}`,
        decode(base64),
        {
          contentType: `image/${uri.split(".").pop()}`,
          upsert: true,
        }
      );
    if (error) return Alert.alert("Error", "Failed to upload profile picture");
    auth.setProfilePicture(uri);
  };

  async function setBioOnServer() {
    if (!socket.isConnected) return;

    try {
      // Check if the user bio exists
      const { data: check, error: selectError } = await socket.supabase
        .from("userBio")
        .select("id, bio")
        .eq("id", auth.user.id);
      if (selectError) return Alert.alert("Error", "Failed to update bio");

      if (check[0]?.bio === bio.trim()) return;

      // Upsert (update or insert) the bio for the user
      const { data, error } = await socket.supabase.from("userBio").upsert({
        id: auth.user.id,
        bio: bio.trim(),
        username: auth.user.username,
      });

      await AsyncStorage.setItem("bio", bio.trim());
      if (error) return Alert.alert("Error", "Failed to update bio");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update bio");
    }
  }

  async function getBio() {
    try {
      const bio = await AsyncStorage.getItem("bio");
      if (bio) setBio(bio);

      if (!socket.isConnected) return;

      const { data, error } = await socket.supabase
        .from("userBio")
        .select("bio")
        .eq("id", auth.user.id);
      if (error) return console.log(error.message);
      setBio((prev) => {
        if (prev !== data[0]?.bio) {
          return data[0]?.bio;
        }
        return prev;
      });
    } catch (err) {
      return;
    }
  }

  useEffect(() => {
    getBio();
  }, [socket.isConnected, auth?.user?.username]);

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
            {"\n\n"}
            11.By using this app, you agree to occasionally send a message with
            your eyes closed, just to test your luck. Typos will be celebrated
            as “artistic expressions.” 🎨🙈✍️
            {"\n\n"}
            12. You promise not to let your phone battery die mid-conversation,
            or else you owe us a virtual pizza as compensation. 🍕🔋😜
            {"\n\n"}
            13. You agree to send at least one GIF a week that makes no sense
            whatsoever. Bonus points if no one can figure it out. 🤔🎥🎉
            {"\n\n"}
            14. By continuing to use this app, you agree to sporadically
            compliment yourself in the mirror while messaging. Self-love is
            important, and we’re here for it. 🪞💬💖
            {"\n\n"}
            15. Our app might or might not let you speak to aliens. If you get a
            reply, don’t say we didn’t warn you! 👽👾🛸
            {"\n\n"}
            16. You agree to send at least one message a day that makes someone
            smile. If you fail, Chip might just come knocking. 👀🚪
            {"\n\n"}
            17. You agree to send a random compliment to someone at least once a
            week. If you don’t, you will not be getting the surprise Chip has in
            store for you! 🎁😄✨
            {"\n\n"}
            18. By using this app, you consent to the possibility of your phone
            getting a personality. If it starts asking for snacks, don’t be
            alarmed—it just wants to bond! 🍕🤖💕
            {"\n\n"}
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
          <View style={styles.center}>
            <View
              style={styles.middle("center", "column", "center", 20, theme)}
            >
              <LongPressComponent
                style={styles.circle(160)}
                onLongPress={(state) => uploadProfilePicture(state)}
                time={500}
                onTap={() => setImageViewerOpen(true)}
              >
                <LinearGradient
                  style={styles.circle(155)}
                  colors={[
                    "#FFC0CB",
                    "#FF69B4",
                    "#FF1493",
                    "#FF69B4",
                    "#FFC0CB",
                  ]}
                >
                  <View style={styles.circle(150, theme.background)}>
                    <Image
                      source={
                        auth.user
                          ? {
                              uri: auth.profilePicture,
                            }
                          : theme.Icons.setting
                      }
                      style={styles.circle(150)}
                    />
                  </View>
                </LinearGradient>
              </LongPressComponent>
              <View style={styles.space(20)} />
              <Text
                style={styles.text(
                  theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D",
                  20,
                  0
                )}
              >
                {auth.user?.username}
              </Text>
              <View style={styles.space(20)} />
              <View style={styles.left}></View>
              <View style={styles.space(10)} />
              <TextInput
                style={styles.textInputStyle(
                  theme.textInputColor,
                  theme.theme,
                  width * 0.8
                )}
                multiline={true}
                numberOfLines={4}
                readOnly={!socket.isConnected}
                value={bio}
                onChangeText={(text) => {
                  if (!socket.isConnected) return;
                  setBio(text);
                }}
                onBlur={() => setBioOnServer()}
                placeholder="bio...."
                placeholderTextColor={
                  theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D"
                }
              />
            </View>
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
          <ImageViewer
            setIsImageViewerOpen={setImageViewerOpen}
            imageUri={auth.profilePicture}
            isProfilePicture={true}
          />
        </Modal>
        <View style={styles.connectionDet}>
          <Text
            style={styles.text(
              theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D",
              15
            )}
          >
            v 1.18.7
          </Text>
          <Text
            style={styles.text(
              theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D",
              15
            )}
          >
            Made wiz ❤️ by Kichu
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
  circle: (size, bg = "transparent") => ({
    height: size,
    width: size,
    borderRadius: size / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: bg,
  }),
  space: (space) => ({
    height: space,
    width: "100%",
  }),
  textInputStyle: (c, t, w) => ({
    height: 160,
    width: w,
    backgroundColor: c.color,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    padding: 10,
    color: t === "dark" ? "#E0E0E0" : "#2D2D2D",
    fontSize: 16,
    textAlignVertical: "top",
  }),
  left: {
    alignSelf: "flex-start",
    width: "80%",
  },
});
