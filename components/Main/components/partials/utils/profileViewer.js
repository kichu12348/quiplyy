import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
  FlatList,
} from "react-native";
import { useState, useEffect } from "react";
import SafeAreaView from "./safe";
import { useTheme } from "../../../../../contexts/theme";
import { useSocket } from "../../../../../contexts/socketContext";
import { useAuth } from "../../../../../contexts/authContext";
import LongPressComponent from "./longPress";
import ImageViewer from "./imageView";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { useBackground } from "../../../../../contexts/imageBackground";
import Icon from "./icons";

const MediaList = ({ imageMessages, setIsOpen }) => {
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [mediaUri, setMediaUri] = useState(null);
  const { width } = Dimensions.get('window');
  const noOfRows = Math.ceil(imageMessages.length / 3);

  return (
    <SafeAreaView>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsOpen(false)}>
          <Icon name="ChevronLeft" size={40} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                      style={styles.rowElem(120, Math.floor(width / 3 - 10))}
                    />
                  </TouchableOpacity>
                );
              }
            }
            rows.push(<View style={styles.row}>{row}</View>);
          }
          return rows;
        })().map((row, index) => (
          <View key={index} style={styles.column}>
            {row}
          </View>
        ))}
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

const BackgroundImage = ({ 
  image, 
  currBackground,  
  downloadBackground, 
  setBackgroundImageForRoom,
  setBackground,
  selectedContact 
}) => {
  const { width, height: screenHeight } = Dimensions.get('window');
  if (!image) return null;
  const isActive = currBackground && currBackground.id === image.id;

  return (
    <View style={styles.backgroundBox(width, screenHeight)}>
      <TouchableOpacity
        style={styles.backgroundContainer(true)}
        onPress={() => {
          if (!image.isDownloaded) {
            downloadBackground(image);
          } else {
            if (isActive) return;
            setBackgroundImageForRoom(image, selectedContact.roomID);
            setBackground(image);
          }
        }}
      >
        <Image
          source={{ uri: image.image }}
          style={styles.backgroundImage("100%", "100%", 10)}
        >
          <>
            {!image.isDownloaded && (
              <View style={styles.downloadBackground(image.isDownloaded)}>
                <Icon name="CloudDownload" size={50} />
              </View>
            )}
            {isActive && (
              <View style={styles.downloadBackground(!isActive)}>
                <Icon name="Check" size={50} />
              </View>
            )}
          </>
        </Image>
      </TouchableOpacity>
    </View>
  );
};

const BackgroundList = ({ 
  backgrounds, 
  theme, 
  setIsBackgroundOpen,
  currBackground,
  downloadBackground,
  setBackgroundImageForRoom,
  setBackground,
  selectedContact
}) => {
  return (
    <BlurView
      intensity={100}
      style={styles.scrollView}
      tint={theme === "dark" ? "dark" : "light"}
    >
      <SafeAreaView backgroundColor={"transparent"}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsBackgroundOpen(false)}>
            <Icon name="ChevronLeft" size={40} />
          </TouchableOpacity>
        </View>
        <View style={styles.flex1}>
          <FlatList
            data={backgrounds}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BackgroundImage 
                image={item}
                currBackground={currBackground}
                downloadBackground={downloadBackground}
                setBackgroundImageForRoom={setBackgroundImageForRoom}
                setBackground={setBackground}
                selectedContact={selectedContact}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </BlurView>
  );
};

const ProfileViewer = ({
  username,
  imageUri,
  setIsOpen,
  messages = null,
  selectedContact = null,
  currBackground = null,
  setBackground
}) => {
  const { theme, textInputColor, background } = useTheme();
  const { isConnected, supabase } = useSocket();
  const { backgrounds, setBackgroundImageForRoom, downloadBackground } = useBackground();
  const auth = useAuth();

  const [bio, setBio] = useState("");
  const [image, setImage] = useState(imageUri);
  const [isOpen, setOpen] = useState(false);
  const [imageMessages, setImageMessages] = useState(
    messages?.filter((msg) => msg.isImage)
  );
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isBackgroundOpen, setIsBackgroundOpen] = useState(false);

  useEffect(() => {
    getBio();
  }, [isConnected, auth?.user?.username]);

  async function getBio() {
    try {
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
      if (error) return;
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

  return (
    <SafeAreaView>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsOpen(false)}>
          <Icon name="ChevronLeft" size={40} />
        </TouchableOpacity>
      </View>
      <View style={styles.spaceEvenly}>
        <View style={styles.ImageContainer}>
          <LongPressComponent
            style={styles.centerDiv}
            onLongPress={() => {}}
            onTap={() => setOpen(true)}
          >
            <LinearGradient
              colors={["#FFC0CB", "#FF69B4", "#FF1493", "#FF69B4", "#FFC0CB"]}
              style={styles.linearGrad(155, 155, 75)}
            >
              <View style={styles.circle(150, background)}>
                <Image
                  source={{ uri: image }}
                  style={styles.image(150, 150, 75)}
                  cachePolicy={"none"}
                />
              </View>
            </LinearGradient>
          </LongPressComponent>
          <Text style={styles.textStyles(theme === "dark" ? "#E0E0E0" : "#2D2D2D", 20, "bold")}>
            {username}
          </Text>
        </View>

        <View style={styles.textInp}>
          <TextInput
            style={styles.textInputStyle(textInputColor, theme)}
            multiline={true}
            numberOfLines={4}
            placeholder="Bio....."
            value={bio}
            readOnly={true}
            placeholderTextColor={
              theme === "dark" ? "rgba(224,224,224,0.5)" : "rgba(45,45,45,0.5)"
            }
          />
        </View>
        {messages && (
          <>
            <View style={styles.mediaBox(0)}>
              <TouchableOpacity
                onPress={() => setIsImageViewerOpen(true)}
                style={styles.mediaContainer(textInputColor.color)}
              >
                <Text style={styles.textStyles(
                  theme === "dark" ? "#E0E0E0" : "#2D2D2D",
                  20,
                  "bold"
                )}>
                  Media
                </Text>
                <Icon name="ChevronRight" size={40} />
              </TouchableOpacity>
            </View>
            <View style={styles.mediaBox()}>
              <TouchableOpacity
                onPress={() => setIsBackgroundOpen(true)}
                style={styles.mediaContainer(textInputColor.color)}
              >
                <Text style={styles.textStyles(
                  theme === "dark" ? "#E0E0E0" : "#2D2D2D",
                  20,
                  "bold"
                )}>
                  Chat Background
                </Text>
                <Icon name="ChevronRight" size={40} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <Modal
        visible={isOpen}
        transparent={true}
        hardwareAccelerated={true}
        onRequestClose={() => setOpen(false)}
        animationType="slide"
      >
        <ImageViewer
          imageUri={image}
          setIsImageViewerOpen={setOpen}
          isProfilePicture={true}
        />
      </Modal>
      <Modal
        visible={isImageViewerOpen}
        transparent={true}
        hardwareAccelerated={true}
        onRequestClose={() => setIsImageViewerOpen(false)}
        animationType="slide"
      >
        <MediaList 
          imageMessages={imageMessages} 
          setIsOpen={setIsImageViewerOpen}
        />
      </Modal>
      <Modal
        visible={isBackgroundOpen}
        transparent={true}
        hardwareAccelerated={true}
        onRequestClose={() => setIsBackgroundOpen(false)}
        animationType="slide"
      >
        <BackgroundList 
          backgrounds={backgrounds}
          theme={theme}
          setIsBackgroundOpen={setIsBackgroundOpen}
          currBackground={currBackground}
          downloadBackground={downloadBackground}
          setBackgroundImageForRoom={setBackgroundImageForRoom}
          setBackground={setBackground}
          selectedContact={selectedContact}
        />
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
    justifyContent: "center",
    gap: 10,
  },
  textStyles: (color = "white", fs = 20, fw = "bold") => ({
    color: color,
    fontSize: fs,
    fontWeight: fw,
  }),
  centerDiv: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  textInputStyle: (c, t) => ({
    height: "100%",
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
  rowElem: (h = 120, w = 120) => ({
    height: h,
    width: w,
    margin: 5,
  }),
  scrollView: {
    flex: 1,
  },
  circle: (r = 50, bg) => ({
    height: r,
    width: r,
    borderRadius: r / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: bg,
  }),
  spaceEvenly: {
    flexDirection: "column",
    flex: 1,
    width: "100%",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  textInp: {
    height: 160,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaBox: (mb = 20) => ({
    height: 60,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: mb,
  }),
  backgroundBox: (w, h) => ({
    height: h * 0.6,
    width: w,
    justifyContent: "center",
    alignItems: "center",
  }),
  backgroundContainer: (w, h) => ({
    height: "90%",
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    positon: "relative",
  }),
  backgroundImage: (w, h, r) => ({
    height: h,
    width: w,
    borderRadius: r,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  }),
  downloadButton: {
    height: 50,
    width: 50,
    alignSelf: "center",
  },
  downloadBackground: (isD = false) => ({
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: isD ? null : "rgba(0,0,0,0.5)",
  }),
  flex1: {
    flex:1
  }
});
