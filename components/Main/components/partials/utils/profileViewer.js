import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import SafeAreaView from "./safe";
import { useTheme } from "../../../../../contexts/theme";
import { useSocket } from "../../../../../contexts/socketContext";
import { useAuth } from "../../../../../contexts/authContext";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LongPressComponent from "./longPress";
import ImageViewer from "./imageView";
import { LinearGradient } from "expo-linear-gradient";

const ProfileViewer = ({ username, imageUri, setIsOpen, messages = null }) => {
  const { theme, Icons, textInputColor,background} = useTheme();
  const { isConnected, supabase } = useSocket();
  const auth = useAuth();

  //states
  const [bio, setBio] = useState("");
  const [image, setImage] = useState(imageUri);
  const [isOpen, setOpen] = useState(false);
  const [imageMessages, setImageMessages] = useState(
    messages?.filter((msg) => msg.isImage)
  );
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [mediaUri, setMediaUri] = useState(null);

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

  const uploadProfilePicture = async (state) => {
    if (!state) return;
    if (!isConnected || auth.user.username !== username) return;
    const uri = await getImage();
    if (!uri) return;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { data, error } = await supabase.storage
      .from("profilePictures")
      .upload(`${auth?.user?.username}.png`, decode(base64), {
        contentType: "image/png",
        upsert: true,
      });
    if (error) return Alert.alert("Error", "Failed to upload profile picture");
    auth.setProfilePicture(uri);
    setImage(uri);
  };

  useEffect(() => {
    getBio();
  }, [isConnected, auth?.user?.username]);

  async function getBio() {
    try {
      if (auth.user.username === username) {
        const bio = await AsyncStorage.getItem("bio");
        if (bio) setBio(bio);
      }

      if (!isConnected) return;
      if (auth?.user?.username !== username) {
        const { data, error } = await supabase
          .from("userBio")
          .select("bio")
          .eq("username", username);
        if (error) return setBio("hmmmmm.....");
        setBio(data[0]?.bio);
        return;
      }
      const { data, error } = await supabase
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

  async function setBioOnServer() {
    if (!isConnected || auth?.user?.username !== username) return;

    try {
      // Check if the user bio exists
      const { data: check, error: selectError } = await supabase
        .from("userBio")
        .select("id, bio")
        .eq("id", auth.user.id);
      if (selectError) return Alert.alert("Error", "Failed to update bio");

      if (check[0]?.bio === bio.trim()) return;

      // Upsert (update or insert) the bio for the user
      const { data, error } = await supabase.from("userBio").upsert({
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

  
  

  const MediaList = ({ imageMessages }) => {
    const noOfRows = Math.ceil(imageMessages.length / 3);
    return (
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsOpen(false)}>
            <Image source={Icons.return} style={styles.image(40, 40, 0)} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {(() => {
            let rows = [];
            for (let i = 0; i < noOfRows; i++) {
              let row = [];
              for (let j = 0; j < 3; j++) {
                if (imageMessages[i * 3 + j]) {
                  row.push(
                    <TouchableOpacity
                      key={`${i}+${j}`}
                      onPress={() => {
                        setIsMediaOpen(true);
                        setMediaUri(imageMessages[i * 3 + j].imageUri);
                      }}
                    >
                      <Image
                        source={{ uri: imageMessages[i * 3 + j].imageUri }}
                        style={styles.rowElem}
                      />
                    </TouchableOpacity>
                  );
                }
              }
              rows.push(<View style={styles.row}>{row}</View>);
            }
            return rows;
          })().map((row, index) => {
            return (
              <View key={index} style={styles.column}>
                {row}
              </View>
            );
          })}
        </ScrollView>
        <Modal 
          visible={isMediaOpen}
          transparent={true}
          hardwareAccelerated={true}
          onRequestClose={() => setIsMediaOpen(false)}
          animationType="slide"
        >
          <ImageViewer imageUri={mediaUri} setIsImageViewerOpen={setIsMediaOpen} />
        </Modal>
      </SafeAreaView>
    );
  };

  return (
    <SafeAreaView>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsOpen(false)}>
          <Image source={Icons.return} style={styles.image(40, 40, 0)} />
        </TouchableOpacity>
      </View>
      <View style={styles.ImageContainer}>
        <LongPressComponent
          style={styles.centerDiv}
          onLongPress={(state) => uploadProfilePicture(state)}
          onTap={() => setOpen(true)}
        >
          <LinearGradient
            colors={["#FFC0CB", "#FF69B4", "#FF1493", "#FF69B4", "#FFC0CB"]}
            style={styles.linearGrad(155, 155, 75)}
          >
            <View style={styles.circle(150,background)}>
            <Image source={{ uri: image }} style={styles.image(150, 150, 75)} />
            </View>
          </LinearGradient>
        </LongPressComponent>
        <Text
          style={styles.textStyles(
            theme === "dark" ? "#E0E0E0" : "#2D2D2D",
            20,
            "bold"
          )}
        >
          {username}
        </Text>
      </View>
      <View style={styles.centerDiv}>
        <View style={styles.leftDiv("80%")}>
          {auth?.user?.username === username && (
            <Text
              style={styles.textStyles(
                theme === "dark"
                  ? "rgba(224,224,224,0.5)"
                  : "rgba(45,45,45,0.5)",
                16,
                500
              )}
            >
              {bio.length}/300
            </Text>
          )}
        </View>
        <View style={styles.space(10)} />
        <TextInput
          style={styles.textInputStyle(textInputColor, theme)}
          multiline={true}
          numberOfLines={4}
          placeholder="Bio....."
          value={bio}
          readOnly={auth?.user?.username !== username || !isConnected}
          onBlur={setBioOnServer}
          onChangeText={(text) => {
            if (text.length > 300) return;
            setBio(text);
          }}
          placeholderTextColor={
            theme === "dark" ? "rgba(224,224,224,0.5)" : "rgba(45,45,45,0.5)"
          }
        />
      </View>
      <View style={styles.space("5%")} />
      {messages && (
        <View style={styles.centerDiv}>
          <TouchableOpacity
            onPress={() => {
              setIsImageViewerOpen(true);
            }}
            style={styles.mediaContainer(textInputColor.color)}
          >
            <Text
              style={styles.textStyles(
                theme === "dark" ? "#E0E0E0" : "#2D2D2D",
                20,
                "bold"
              )}
            >
              Media
            </Text>
            <Image source={Icons.return} style={styles.image(35, 35, 0, 180)} />
          </TouchableOpacity>
        </View>
      )}
      <Modal
        visible={isOpen}
        transparent={true}
        hardwareAccelerated={true}
        onRequestClose={() => setOpen(false)}
        animationType="slide"
      >
        <ImageViewer imageUri={image} setIsImageViewerOpen={setOpen} isProfilePicture={true}/>
      </Modal>
      <Modal
        visible={isImageViewerOpen}
        transparent={true}
        hardwareAccelerated={true}
        onRequestClose={() => setIsImageViewerOpen(false)}
        animationType="slide"
      >
        <MediaList imageMessages={imageMessages} />
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileViewer;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  image: (h = 40, w = 40, br = 0, rot = 0) => ({
    height: h,
    width: w,
    borderRadius: br,
    alignSelf: "center",
    transform: [{ rotate: `${rot}deg` }],
  }),
  ImageContainer: {
    height: "30%",
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 10,
  },
  textStyles: (color = "white", fs = 20, fw = "bold") => ({
    color: color,
    fontSize: fs,
    fontWeight: fw,
  }),
  centerDiv: {
    justifyContent: "center",
    alignItems: "center",
  },
  textInputStyle: (c, t) => ({
    height: 160,
    width: "80%",
    backgroundColor: c.color,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    padding: 10,
    color: t === "dark" ? "#E0E0E0" : "#2D2D2D",
    fontSize: 16,
    textAlignVertical: "top",
  }),
  leftDiv: (w = "100%") => ({
    width: w,
    justifyContent: "center",
    alignItems: "flex-start",
  }),
  space: (h = 10) => ({
    height: h,
    width: "100%",
  }),
  mediaContainer: (bg) => ({
    height: 60,
    width: "80%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 30,
    backgroundColor: bg,
  }),
  linearGrad: (h = 155, w = 155, r = 75) => ({
    height: h,
    width: w,
    borderRadius: r,
    justifyContent: "center",
    alignItems: "center",
  }),
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "space-evenly",
  },
  column: {
    flexDirection: "column",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
  },
  rowElem: {
    height: 120,
    width: 120,
    margin: 5,
  },
  scrollView: {
    flex: 1,
  },
circle: (r = 50,bg) => ({
    height: r,
    width: r,
    borderRadius: r / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: bg,
}),
});
