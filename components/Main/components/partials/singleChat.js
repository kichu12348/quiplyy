import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  FlatList,
  Modal,
  Alert,
  ImageBackground,
  Dimensions,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../../contexts/theme";
import { useMessager } from "../../../../contexts/messagerContext";
import { useSocket } from "../../../../contexts/socketContext";
import { useAuth } from "../../../../contexts/authContext";
import AddUserToGroup from "./addUserToGroup";
import {
  uploadImage,
  deleteFile,
  downloadFile,
  copyFileToDocumentDirectory,
} from "./utils/fileUpload";
import ImageViewer from "./utils/imageView";
import ProfileViewer from "./utils/profileViewer";
import StickerComponent from "./chatComps/stickerComp";
import BlurItem from "./chatComps/blurItem";
import { Image } from "expo-image";
import RenderList from "./chatComps/renderList";
import { BlurView } from "expo-blur";
import { usePineappleBan } from "../../../../contexts/pineabbleBanContext";
import Icon from "./utils/icons";


const SingleChat = ({ navigation }) => {
  const { theme, Icons, textInputColor, stickerList, stickers } = useTheme();
  const { selectedContact, randomUID, setSelectedContact } = useMessager();
  const {
    socket,
    isConnected,
    isLoading,
    endPoint,
    supabase,
    allMessages,
    setAllMessages,
  } = useSocket();
  const { user, token } = useAuth();

  const {checkIfTextHasPineapple,setBanTime}=usePineappleBan();

  axios.defaults.baseURL = `${endPoint}/message`;

  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSticker, setIsSticker] = useState(false);
  const [isFocused, setIsFocused] = useState({ focused: false, item: null });
  const [isTyping, setIsTyping] = useState(false);
  const [isAddUser, setIsAddUser] = useState(false);
  const [maxHeight, setMaxHeight] = useState(50);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [isProfileViewerOpen, setIsProfileViewerOpen] = useState(false);
  const [background, setBackground] = useState(null);
  const receivedMessageIds = useRef(new Set());
  const flatListRef = useRef(null);

  const shortenName = (name) => {
    return name.length > 10 ? name.slice(0, 10) + "..." : name;
  };

  async function getBackgroundImage() {
    const roomID = selectedContact.roomID;
    const data = await AsyncStorage.getItem(`background_${roomID}`);
    if (data) return JSON.parse(data);
    return null;
  }

  const { width, height } = Dimensions.get("window");

  async function setBackgroundImage() {
    const data = await getBackgroundImage();
    if (data) {
      setBackground(data);
      return;
    }
  }

  useEffect(() => {
    setBackgroundImage();
  }, []);

  const dbPromise = SQLite.openDatabaseAsync("messages.db");

  const createTableIfNotExists = async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        idx INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT,
        sender TEXT,
        senderName TEXT,
        msg TEXT,
        roomID TEXT,
        isSticker BOOLEAN DEFAULT 0,
        sticker TEXT DEFAULT NULL,
        isDeleted BOOLEAN DEFAULT 0,
        isGroup BOOLEAN DEFAULT 0,
        isImage BOOLEAN DEFAULT 0,
        imageUri TEXT DEFAULT NULL,
        isDownloaded BOOLEAN DEFAULT 0,
        time TEXT
      );
    `);
  };

  const loadMessages = async (db) => {
    const rows = allMessages.filter((e) => e.roomID === selectedContact.roomID);
    rows.map((e) => {
      receivedMessageIds.current.add(e.id);
    });
    setMessages(rows);
  };

  const addMessageToDB = async (db, message) => {
    if (message.isDeleted) {
      if (message.isImage) {
        const imageUri = await db.runAsync(
          `
          SELECT imageUri FROM messages WHERE id = ?`,
          [message.id]
        );
        if (imageUri) await deleteFile(imageUri);
      }
      await db.runAsync("DELETE FROM messages WHERE id = ?", [message.id]);
      setMessages((prev) => prev.filter((e) => e.id !== message.id));
      setAllMessages((prev) => prev.filter((e) => e.id !== message.id));
      return;
    }
    if (message.isSticker) {
      await db.runAsync(
        `
        INSERT INTO messages (id, sender, msg, roomID, time,isSticker, sticker,isDeleted,isGroup,senderName,isImage,imageUri,isDownloaded) VALUES (?, ?, ?, ?, ?,?,?,?,?,?,?,?,?)`,
        [
          message.id,
          message.sender,
          message.msg,
          message.roomID,
          message.time,
          message.isSticker,
          message.sticker,
          message.isDeleted,
          message.isGroup,
          message.senderName,
          message.isImage,
          message.imageUri,
          true,
        ]
      );
      return;
    }
    if (message.isImage) {
      if (message.sender === user?.id) {
        const uri = await copyFileToDocumentDirectory(message.localFileUri);
        if (!uri) return;
        await db.runAsync(
          `INSERT INTO messages (id, sender, msg, roomID, time,isSticker, sticker,isDeleted,isGroup,senderName,isImage,imageUri,isDownloaded) VALUES (?, ?, ?, ?, ?,?,?,?,?,?,?,?,?)`,
          [
            message.id,
            message.sender,
            message.msg,
            message.roomID,
            message.time,
            message.isSticker,
            message.sticker,
            message.isDeleted,
            message.isGroup,
            message.senderName,
            message.isImage,
            uri,
            true,
          ]
        );
        return;
      } else {
        await db.runAsync(
          `INSERT INTO messages (id, sender, msg, roomID, time,isSticker, sticker,isDeleted,isGroup,senderName,isImage,imageUri,isDownloaded) VALUES (?, ?, ?, ?, ?,?,?,?,?,?,?,?,?)`,
          [
            message.id,
            message.sender,
            message.msg,
            message.roomID,
            message.time,
            message.isSticker,
            message.sticker,
            message.isDeleted,
            message.isGroup,
            message.senderName,
            message.isImage,
            message.imageUri,
            true,
          ]
        );

        return;
      }
    }
    await db.runAsync(
      `INSERT INTO messages (id, sender, msg, roomID, time,isSticker, sticker,isDeleted,isGroup,senderName,isImage,imageUri,isDownloaded) VALUES (?, ?, ?, ?, ?,?,?,?,?,?,?,?,?)`,
      [
        message.id,
        message.sender,
        message.msg,
        message.roomID,
        message.time,
        message.isSticker,
        message.sticker,
        message.isDeleted,
        message.isGroup,
        message.senderName,
        message.isImage,
        message.imageUri,
        message.isDownloaded,
      ]
    );
  };

  const handleIncomingMessage = useCallback(
    async (message) => {
      if (!isConnected || !selectedContact || message.sender === user?.id)
        return;
      const db = await dbPromise;
      if (message.isDeleted) {
        if (user?.id === message.sender) return;
        if (receivedMessageIds.current.has(message.id)) {
          receivedMessageIds.current.delete(message.id);
          await addMessageToDB(db, message);
        }

        await axios.post("/delete", {
          messageId: message.id,
          isGroup: selectedContact?.isGroup,
          noOfMembers: selectedContact.noOfMembers,
          sender: message.sender,
          isImage: message.isImage,
          token,
        });
        return;
      }

      if (!receivedMessageIds.current.has(message.id)) {
        receivedMessageIds.current.add(message.id);
        if (message.isImage) {
          const { success, uri } = await downloadFile(message.imageUri);
          if (!success) return;
          message.imageUri = uri;
          setMessages((prev) => [...prev, message]);
          setAllMessages((prev) => [...prev, message]);
          await addMessageToDB(db, message);
        } else {
          setMessages((prev) => [...prev, message]);
          setAllMessages((prev) => [...prev, message]);
          await addMessageToDB(db, message);
        }
        await axios.post("/delete", {
          messageId: message.id,
          isGroup: selectedContact?.isGroup,
          noOfMembers: selectedContact?.noOfMembers,
          sender: message.sender,
          isImage: message.isImage,
        });
      }
    },
    [isConnected, selectedContact, user?.id]
  );

  const startChat = async () => {
    try {
      const db = await dbPromise;
      await createTableIfNotExists(db);
      await loadMessages(db);
      if (!isConnected || !selectedContact) return;
      socket?.emit("joinRoom", { roomID: selectedContact.roomID });
      const res = await axios.post("/check", {
        roomID: selectedContact.roomID,
        isGroup: selectedContact?.isGroup,
        noOfMembers: selectedContact?.noOfMembers,
        token,
      });
      if (res.data.success) {
        for (const message of res.data.messages) {
          if (
            message.sender !== user?.id &&
            !receivedMessageIds.current.has(message.id)
          ) {
            handleIncomingMessage(message);
          }
          if (
            message.sender !== user?.id &&
            receivedMessageIds.current.has(message.id) &&
            message.isDeleted
          ) {
            handleIncomingMessage(message);
          }
        }
      }
      flatListRef.current?.scrollToEnd({
        animated: true,
      });
    } catch (e) {
      console.log("error: check message: ", e.message);
    }
  };

  useEffect(() => {
    startChat();
  }, [selectedContact, isConnected]);

  const sendSticker = async (sticker) => {
    if (!isConnected || !selectedContact) return;
    const message = {
      id: randomUID(),
      sender: user?.id,
      senderName: user.username,
      msg: "",
      roomID: selectedContact?.roomID,
      time: new Date().toISOString(),
      isSticker: true,
      sticker: sticker,
      isDeleted: false,
      isGroup: selectedContact?.isGroup,
      noOfMembers: selectedContact?.noOfMembers,
      isImage: false,
      imageUri: null,
      isDownloaded: false,
    };

    const db = await dbPromise;
    await addMessageToDB(db, message);
    setMessages((prev) => [...prev, message]);
    setAllMessages((prev) => [...prev, message]);
    socket.emit("message", { message });
    setIsSticker(false);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const sendMessage = async () => {
    if (!isConnected || msg.trim() === "") return;

    const message = {
      id: randomUID(),
      sender: user?.id,
      senderName: user.username,
      msg: msg.trim(),
      roomID: selectedContact?.roomID,
      time: new Date().toISOString(),
      isSticker: false,
      sticker: null,
      isDeleted: false,
      isGroup: selectedContact?.isGroup,
      noOfMembers: selectedContact?.noOfMembers,
      isImage: false,
      imageUri: null,
      isDownloaded: false,
    };
    if (checkIfTextHasPineapple(msg)) {
      setBanTime();
    }
    setMsg("");
    const db = await dbPromise;
    await addMessageToDB(db, message);
    setMessages((prev) => [...prev, message]);
    setAllMessages((prev) => [...prev, message]);
    socket.emit("message", { message });
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const deleteMessage = async (messageId, item) => {
    const message = {
      id: messageId,
      sender: user?.id,
      senderName: user.username,
      msg: "",
      roomID: selectedContact.roomID,
      time: new Date().toISOString(),
      isSticker: false,
      sticker: null,
      isDeleted: true,
      isGroup: selectedContact?.isGroup,
      noOfMembers: selectedContact.noOfMembers,
      isImage: item.isImage,
      imageUri: null,
    };
    loaded = true;
    setIsFocused({ focused: false, item: item });
    const db = await dbPromise;
    await addMessageToDB(db, message);
    socket.emit("message", { message });
    setTimeout(() => {
      loaded = false;
    }, 500);
  };

  async function deleteMessageForMe(messageId) {
    const db = await dbPromise;
    await db.runAsync("DELETE FROM messages WHERE id = ?", [messageId]);
    setIsFocused({ focused: false, item: null });
    setMessages((prev) => prev.filter((e) => e.id !== messageId));
    setAllMessages((prev) => prev.filter((e) => e.id !== messageId));
  }
  useEffect(() => {
    if (socket) {
      socket.on("newMessage", handleIncomingMessage);
      socket.on("typing", ({ id }) => {
        if (id !== selectedContact.id) return;
        if (isTyping) return;
        if (id === user?.id) return;
        if (isTyping) return;
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 5000);
      });
      return () => {
        socket.off("newMessage", handleIncomingMessage);
      };
    }
  }, [handleIncomingMessage]);

  const longPressEventHandle = (state, item) => {
    if (!state) return;
    if (state) {
      setIsFocused({ focused: true, item: item });
      flatListRef.current.scrollToIndex({
        index: messages.indexOf(item),
        animated: true,
      });
    }
  };

  const onTapOnImage = (state, item) => {
    if (!item.isImage || !state) return;
    setIsImageViewerOpen(true);
    setImageUri(item.imageUri);
  };

  const isTypingHandler = (text) => {
    if (!isConnected || !selectedContact || !socket) return;
    if (text.trim() === "") return;
    socket?.emit("typing", { roomID: selectedContact.roomID, user: user?.id });
  };

  async function uploadFile() {
    const res = await uploadImage(supabase);
    if (!res) return;
    if (!res.success && res.err) {
      Alert.alert(res.err);
      return;
    }
    const message = {
      id: randomUID(),
      sender: user?.id,
      senderName: user.username,
      msg: "",
      roomID: selectedContact?.roomID,
      time: new Date().toISOString(),
      isSticker: false,
      sticker: null,
      isDeleted: false,
      isGroup: selectedContact?.isGroup,
      noOfMembers: selectedContact?.noOfMembers,
      isImage: true,
      imageUri: res.uri,
      isDownloaded: false,
      localFileUri: res.localFileUri,
    };
    const newMessage = {
      id: message.id,
      sender: message.sender,
      senderName: message.senderName,
      msg: message.msg,
      roomID: message.roomID,
      time: message.time,
      isSticker: message.isSticker,
      sticker: message.sticker,
      isDeleted: message.isDeleted,
      isGroup: message.isGroup,
      noOfMembers: message.noOfMembers,
      isImage: message.isImage,
      imageUri: message.localFileUri,
      isDownloaded: message.isDownloaded,
    };
    const db = await dbPromise;
    await addMessageToDB(db, message);
    setMessages((prev) => [...prev, newMessage]);
    setAllMessages((prev) => [...prev, newMessage]);
    socket.emit("message", { message });
    flatListRef.current?.scrollToEnd({ animated: true });
  }

  return (
    <SafeAreaView>
      <View style={styles.header(theme)}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.Image(10, 20)}
        >
          <Icon name="ChevronLeft" size={40} />
        </TouchableOpacity>

        <Text style={styles.textStyles(theme)}>
          {selectedContact
            ? shortenName(selectedContact?.username)
            : "Single Chat"}
        </Text>
        {!selectedContact?.isGroup ? (
          <TouchableOpacity
            onPress={() => {
              setIsProfileViewerOpen(true);
            }}
            style={styles.Image(20, 10)}
          >
            <Image
              source={{
                uri: `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/profilePictures/${selectedContact.username.trim()}.jpg?time=${new Date().getHours()}`,
              }}
              style={styles.Image(0, 0)}
              cachePolicy={"none"}
            />
          </TouchableOpacity>
        ) : (
          <>
            <Icon name="Users" size={40} />
            <View style={styles.addUserConatiner}>
              <TouchableOpacity
                onPress={() => setIsAddUser(true)}
                disabled={!isConnected || isLoading || !socket}
              >
                <Icon name="CirclePlus" size={40} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 10}
      >
        <ImageBackground
          source={{
            uri: background?.image,
          }}
          style={styles.flex1}
        >
          {/* Main content container */}
          <View style={styles.contentContainer}>
            {/* Messages list that extends behind the input */}
            <FlatList
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              data={messages}
              renderItem={({ item }) => (
                <RenderList
                  item={item}
                  isFocused={isFocused}
                  longPressEventHandle={longPressEventHandle}
                  onTapOnImage={onTapOnImage}
                  stickers={stickers}
                  background={background}
                />
              )}
              ref={flatListRef}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                flatListRef.current.scrollToEnd({ animated: true });
              }}
              onLayout={() => {
                flatListRef.current.scrollToEnd({ animated: true });
              }}
            />

            {/* Floating input container */}
            <View style={styles.floatingInputContainer}>
              <View style={styles.textInp(width, maxHeight, false, theme)}>
                <BlurView
                  intensity={80}
                  tint={theme === "dark" ? "dark" : "light"}
                  style={styles.inputBlurContainer(maxHeight)}
                >
                  <View style={styles.inputContent(textInputColor, maxHeight)}>
                    {msg.trim() === "" ? (
                      <>
                        <TouchableOpacity
                          onPress={() => setIsSticker(true)}
                          style={styles.Button(
                            theme,
                            isConnected && socket,
                            35,
                            35,
                            10
                          )}
                          disabled={!isConnected || isLoading || !socket}
                        >
                          <Icon name="SmilePlus" 
                          size={35}
                          color={"#fff"}
                           />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => uploadFile(endPoint)}
                          style={styles.Button(
                            theme,
                            isConnected && socket,
                            35,
                            35,
                            10
                          )}
                          disabled={!isConnected || isLoading || !socket}
                        >
                          <Icon 
                          name="CloudUpload" 
                          size={35} 
                          color={"#fff"}
                          />
                        </TouchableOpacity>
                      </>
                    ) : null}
                    <TextInput
                      placeholder="Type a message"
                      placeholderTextColor={
                        theme === "dark" ? "#E0E0E0" : "#2D2D2D"
                      }
                      style={styles.TextInput(theme)}
                      readOnly={!isConnected || isLoading || !socket}
                      multiline={true}
                      numberOfLines={4}
                      editable={isConnected && !isLoading && socket}
                      onContentSizeChange={(e) => {
                        if (
                          e.nativeEvent.contentSize.height > 50 &&
                          e.nativeEvent.contentSize.height < 80
                        ) {
                          setMaxHeight(e.nativeEvent.contentSize.height);
                        } else if (e.nativeEvent.contentSize.height > 80) {
                          setMaxHeight(80);
                        } else {
                          setMaxHeight(50);
                        }
                      }}
                      value={msg}
                      onChangeText={(text) => {
                        setMsg(text);
                        isTypingHandler(text);
                      }}
                    />
                    <TouchableOpacity
                      onPress={sendMessage}
                      style={styles.Button(
                        theme,
                        isConnected && socket,
                        35,
                        35,
                        0,
                        10
                      )}
                      disabled={
                        !isConnected ||
                        msg.trim() === "" ||
                        isLoading ||
                        !socket
                      }
                    >
                      <Icon name="SendHorizontal" 
                      size={30} 
                      color={"#fff"}
                      />
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </View>
            </View>
            <View style={styles.bottomBar}></View>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>

      <Modal
        visible={isSticker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSticker(false)}
        hardwareAccelerated={true}
      >
        <StickerComponent
          setIsSticker={setIsSticker}
          sendSticker={sendSticker}
          stickerList={stickerList}
          stickers={stickers}
        />
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        hardwareAccelerated={true}
        visible={isFocused.focused}
      >
        <BlurItem
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          longPressEventHandle={longPressEventHandle}
          onTapOnImage={onTapOnImage}
          stickers={stickers}
          deleteMessage={deleteMessage}
          deleteMessageForMe={deleteMessageForMe}
        />
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        hardwareAccelerated={true}
        visible={isAddUser}
        onRequestClose={() => setIsAddUser(false)}
      >
        <AddUserToGroup
          setIsAddUser={setIsAddUser}
          groupId={selectedContact}
          setCurrentContact={setSelectedContact}
        />
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        hardwareAccelerated={true}
        visible={isImageViewerOpen}
        onRequestClose={() => setIsImageViewerOpen(false)}
      >
        <ImageViewer
          imageUri={imageUri}
          setIsImageViewerOpen={setIsImageViewerOpen}
        />
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        hardwareAccelerated={true}
        visible={isProfileViewerOpen}
        onRequestClose={() => setIsProfileViewerOpen(false)}
      >
        <ProfileViewer
          username={selectedContact.username}
          setIsOpen={setIsProfileViewerOpen}
          imageUri={`https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/profilePictures/${selectedContact.username.trim()}.jpg`}
          messages={messages}
          selectedContact={selectedContact}
          currBackground={background}
          setBackground={setBackground}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default SingleChat;

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    position: "relative",
  }),
  background: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 80,
  },
  floatingInputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingBottom: 8,
    zIndex: 1,
  },
  inputContent: (color, height = 50) => ({
    flexDirection: "row",
    alignItems: height === 50 ? "center" : "flex-end",
    justifyContent: "space-evenly",
    paddingVertical: 5,
    minHeight: height,
  }),
  textStyles: (
    theme,
    fontSize = 20,
    fontWeight = "bold",
    color = theme === "dark" ? "#E0E0E0" : "#2D2D2D",
    opacity = 1
  ) => ({
    color: color !== null ? color : theme === "dark" ? "#E0E0E0" : "#2D2D2D",
    fontSize: fontSize,
    fontWeight: fontWeight,
    opacity: opacity,
  }),
  header: (theme) => ({
    height: 50,
    width: "100%",
    backgroundColor: "transparent",
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    borderBottomWidth: 0.5,
    borderBottomColor:
      theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    paddingBottom: 10,
  }),
  Image: (
    marginLeft = 0,
    marginR = 0,
    height = 40,
    width = 40,
    borderRadius = 0,
    alignSelf = "center"
  ) => ({
    height: height,
    width: width,
    marginLeft: marginLeft,
    marginRight: marginR,
    borderRadius: borderRadius === 0 ? height / 2 : borderRadius,
    alignSelf: alignSelf,
  }),
  body: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  flatListContainer: {
    flex: 1,
  },
  footer: () => ({
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 5,
  }),
  textInp: (width, height = 50, isBlur = false, theme) => ({
    height: height,
    width: isBlur ? "100%" : width * 0.9625,
    flexDirection: "row",
    alignItems: height === 50 ? "center" : "flex-end",
    justifyContent: "space-evenly",
    borderRadius: height !== 50 ? 10 : 30,
    paddingBottom: !isBlur ? 0 : height === 50 ? 0 : 5,
    overflow: "hidden",
    ...Platform.select({
      android: {
        marginBottom: isBlur ? 0 : 5,
        backgroundColor: theme === "dark" ? "rgba(30,30,30,0.8)" : "#e0e0e0",
      },
      ios: {
        backgroundColor: null,
      },
    }),
  }),
  TextInput: (theme) => ({
    minHeight: 50,
    flex: 1,
    padding: 15,
    color: theme === "dark" ? "#E0E0E0" : "#2D2D2D",
    fontWeight: "400",
    alignItems: "center",
    alignText: "center",
    alignSelf: "center",
  }),
  Button: (
    theme,
    isC,
    height = 50,
    width = 50,
    marginLeft = 0,
    marginR = 0
  ) => ({
    height: height,
    width: width,
    backgroundColor:
      theme === "dark"
        ? `rgba(198,0,198,${isC ? 0.8 : 0.2})`
        : `rgba(0,255,0,${isC ? 0.8 : 0.2})`,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginLeft: marginLeft,
    marginRight: marginR,
  }),
  blurView: (justifyContent = "center") => ({
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: justifyContent === "center" ? 0 : 20,
  }),
  blurContainer: {
    height: 200,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "transparent",
  },
  blurList: () => ({
    marginTop: 10,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    height: 50,
    minWidth: 200,
    padding: 10,
    borderRadius: 20,
  }),
  blurText: (color = "white") => ({
    fontSize: 25,
    fontWeight: "bold",
    color: color,
  }),
  blurTextContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  updateContainer: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 20,
    paddingHorizontal: 10,
  },
  addUserConatiner: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 10,
  },
  flex1: {
    flex: 1,
  },
  inputBlurContainer: (height) => ({
    height: height,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-evenly",
  }),
  contentContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomBar: {
    height: 20,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
