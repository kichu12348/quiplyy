import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  FlatList,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useCallback, useEffect, useRef, useState,memo } from "react";
import axios from "axios";
import * as SQLite from "expo-sqlite";
import { useTheme } from "../../../../contexts/theme";
import { useMessager } from "../../../../contexts/messagerContext";
import { useSocket } from "../../../../contexts/socketContext";
import { useAuth } from "../../../../contexts/authContext";
import { BlurView } from "expo-blur";
import LongPressComponent from "./utils/longPress";
import AddUserToGroup from "./addUserToGroup";
import {
  uploadImage,
  deleteFile,
  downloadFile,
  copyFileToDocumentDirectory,
} from "./utils/fileUpload";

const SingleChat = ({ navigation }) => {
  const { theme, Icons, textInputColor } = useTheme();
  const { selectedContact, randomUID, setSelectedContact } = useMessager();
  const { socket, isConnected, isLoading, endPoint } = useSocket();
  const { user, token } = useAuth();

  axios.defaults.baseURL = `${endPoint}/message`;

  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSticker, setIsSticker] = useState(false);
  const [isFocused, setIsFocused] = useState({ focused: false, item: null });
  const [isTyping, setIsTyping] = useState(false);
  const [isAddUser, setIsAddUser] = useState(false);
  const [maxHeight, setMaxHeight] = useState(50);
  const receivedMessageIds = useRef(new Set());
  const flatListRef = useRef(null);


  const shortenName = (name) => {
    return name.length > 10 ? name.slice(0, 10) + "..." : name;
  };

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

  const stickers = {
    mogCat: require("./stickers/mogCat.gif"),
    bonjour: require("./stickers/bonjour.jpeg"),
    fisiks: require("./stickers/fisiks.jpeg"),
    ionGetIt: require("./stickers/ionGetIt.jpeg"),
    mexicanCat: require("./stickers/mexicanCat.gif"),
    stopThinking: require("./stickers/stopThinking.jpeg"),
    think: require("./stickers/think.jpeg"),
    tricks: require("./stickers/tricks.jpeg"),
    vanish: require("./stickers/vanish.gif"),
    smileCat: require("./stickers/smileCat.gif"),
    sus: require("./stickers/sus.png"),
    okCat: require("./stickers/okCat.png"),
    dogIntense: require("./stickers/dogIntense.gif"),
    dancingDoge: require("./stickers/dancingDoge.gif"),
    dancingDog: require("./stickers/dancingDog.gif"),
    susAmg: require("./stickers/susAmg.png"),
  };
  const stickerList = [
    { id: 1, name: "mogCat" },
    { id: 2, name: "bonjour" },
    { id: 3, name: "fisiks" },
    { id: 4, name: "ionGetIt" },
    { id: 5, name: "mexicanCat" },
    { id: 6, name: "stopThinking" },
    { id: 7, name: "think" },
    { id: 8, name: "tricks" },
    { id: 9, name: "vanish" },
    { id: 10, name: "smileCat" },
    { id: 11, name: "sus" },
    { id: 12, name: "okCat" },
    { id: 13, name: "dogIntense" },
    { id: 14, name: "dancingDoge" },
    { id: 15, name: "dancingDog" },
    { id: 16, name: "susAmg" },
  ];
  const loadMessages = async (db) => {
    const rows = await db.getAllAsync(
      "SELECT * FROM messages WHERE roomID = ?",
      [selectedContact.roomID]
    );
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
          const { success, uri } = await downloadFile(
            message.imageUri,
            endPoint
          );
          if (!success) return;
          message.imageUri = uri;
          setMessages((prev) => [...prev, message]);
          await addMessageToDB(db, message);
        } else {
          setMessages((prev) => [...prev, message]);
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

  function isOnlyEmojis(text) {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    const trimmedText = text.replace(/\s+/g, "");
    const emojiMatches = trimmedText.match(emojiRegex);
    return emojiMatches && emojiMatches.length === [...trimmedText].length;
  }

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
      flatListRef.current?.scrollToEnd({ animated: true });
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
    socket.emit("message", { message });
    setIsSticker(false);
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

    setMsg("");
    const db = await dbPromise;
    await addMessageToDB(db, message);
    setMessages((prev) => [...prev, message]);
    socket.emit("message", { message });
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

  longPressEventHandle = (state, item) => {
    if (item.sender !== user?.id) return;
    if (state) {
      setIsFocused({ focused: true, item: item });
    }
  };

  const isTypingHandler = (text) => {
    if (!isConnected || !selectedContact || !socket) return;
    if (text.trim() === "") return;
    socket?.emit("typing", { roomID: selectedContact.roomID, user: user?.id });
  };

  async function uploadFile(endPoint) {
    const res = await uploadImage(endPoint);
    if(!res) return;
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
    socket.emit("message", { message });
  }

  //components
  const RenderList =({ item }) => {
    if(!item) return null
    return (
      <View
        style={styles.flatListItem(
          item.sender === user?.id ? "flex-end" : "flex-start"
        )}
      >
        <LongPressComponent
          key={item?.id}
          onLongPress={(state) => longPressEventHandle(state, item)}
          time={500}
        >
          <View
            style={
              item.sender === user?.id
                ? styles.messageLeft(
                    item.isSticker || item.isImage
                      ? true
                      : isOnlyEmojis(item.msg),
                    theme
                  )
                : styles.messageRight(
                    item.isSticker || item.isImage
                      ? true
                      : isOnlyEmojis(item.msg),
                    theme
                  )
            }
          >
            {item.isSticker && !item.isImage ? (
              <>
                {item.isGroup && item.sender !== user?.id ? (
                  <Text
                    style={styles.textStyles(
                      theme,
                      15,
                      "400",
                      theme === "dark" ? "white" : "black",
                      0.8
                    )}
                  >
                    {item.senderName}
                  </Text>
                ) : null}
                {item.isSticker && !item.isImage ? (
                <Image
                  source={stickers[item.sticker]}
                  style={styles.Image(
                    item.sender === user?.id ? 0 : -10,
                    item.sender === user?.id ? -10 : 0,
                    200,
                    200,
                    10
                  )}
                />):null}
              </>
            ) : !item.isImage && !item.isSticker ? (
              <>
                {item.isGroup && item.sender !== user?.id ? (
                  <Text style={styles.textStyles(theme, 12, "400", null, 0.8)}>
                    {item.senderName}
                  </Text>
                ) : null}
                <Text
                  style={styles.textStyles(
                    theme,
                    isOnlyEmojis(item.msg) ? 60 : 18,
                    "400",
                    null
                  )}
                >
                  {item.msg}
                </Text>
              </>
            ) : (
              <>
                {item.isGroup && item.sender !== user?.id ? (
                  <Text style={styles.textStyles(theme, 12, "400", null, 0.8)}>
                    {item.senderName}
                  </Text>
                ) : null}
                {item.isImage && (
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.Image(
                    item.sender === user?.id ? 0 : -10,
                    item.sender === user?.id ? -10 : 0,
                    200,
                    200,
                    10
                  )}
                />)}
              </>
            )}
          </View>
        </LongPressComponent>
      </View>
    );
  };



  const rowLength =
    stickerList.length % 3 === 0
      ? stickerList.length / 3
      : Math.floor(stickerList.length / 3) + 1;

  const StickerComponent = () => {
    return (
      <TouchableWithoutFeedback onPress={() => setIsSticker(false)}>
        <View style={styles.stickerModal}>
          <BlurView intensity={300} style={styles.stickerContainer()}>
            <View style={styles.stickerHeader}>
              <TouchableOpacity
                style={styles.Image(10, 20, 40, 40, 0, "flex-start")}
                onPress={() => setIsSticker(false)}
              >
                <Image
                  source={Icons.return}
                  style={styles.Image(10, 20, 40, 40, 0, "flex-start")}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.stickers}>
              <ScrollView scrollEnabled={true} style={styles.ScrollView}>
                {stickerList.length > 0
                  ? (() => {
                      const stickerItems = [];
                      for (let index = 0; index < rowLength; index++) {
                        const stickerRow = [
                          stickerList[index * 3],
                          stickerList[index * 3 + 1] || null,
                          stickerList[index * 3 + 2] || null,
                        ];

                        stickerItems.push(
                          <View key={`row-${index}`} style={styles.rows}>
                            <StickerItem stickersL={stickerRow} />
                          </View>
                        );
                      }
                      return stickerItems;
                    })()
                  : null}
              </ScrollView>
            </View>
          </BlurView>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const StickerItem = ({ stickersL }) => {
    return (
      <>
        {stickersL.map((sticker, index) => {
          return sticker ? (
            <TouchableOpacity
              key={sticker.id}
              onPress={() => sendSticker(sticker.name)}
            >
              <Image
                source={stickers[sticker.name]}
                style={styles.Image(10, 10, 100, 100, 20)}
              />
            </TouchableOpacity>
          ) : (
            <View key={`empty-${index}`} />
          );
        })}
      </>
    );
  };

  const BlurItem = ({ isFocused }) => {
    return (
      <TouchableWithoutFeedback
        onPress={() => setIsFocused({ focused: false, item: isFocused.item })}
      >
        <BlurView
          intensity={300}
          style={styles.blurView(
            isFocused.item?.isSticker ? "center" : "flex-end"
          )}
        >
          <View style={styles.blurContainer}>
            <RenderList item={isFocused.item} />
            <View style={styles.blurList(theme)}>
              <TouchableOpacity
                style={styles.blurTextContainer}
                onPress={() => {
                  deleteMessage(isFocused.item.id, isFocused.item);
                }}
              >
                <Text style={styles.blurText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <SafeAreaView>
      <View style={styles.header(theme)}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.Image(10, 20)}
        >
          <Image source={Icons.return} style={styles.Image()} />
        </TouchableOpacity>

        <Text style={styles.textStyles(theme)}>
          {selectedContact
            ? shortenName(selectedContact?.username)
            : "Single Chat"}
        </Text>
        {!selectedContact?.isGroup ? (
          <Image
            source={{
              uri: `https://api.multiavatar.com/${selectedContact.username}.png?apikey=CglVv3piOwAuoJ`,
            }}
            style={styles.Image(20, 10)}
          />
        ) : (
          <>
            <Image source={Icons.group} style={styles.Image(20, 10)} />
            <View style={styles.addUserConatiner}>
              <TouchableOpacity
                onPress={() => setIsAddUser(true)}
                disabled={!isConnected || isLoading || !socket}
              >
                <Image source={Icons.add} style={styles.Image()} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled
        keyboardVerticalOffset={Platform.OS === "ios" ? 45 : 25}
      >
        <View style={styles.flatListContainer}>
          <FlatList
            data={messages}
            renderItem={RenderList}
            ref={flatListRef}
            onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
            onContentSizeChange={() =>
              flatListRef.current.scrollToEnd({ animated: true })
            }
          />
        </View>
        <View style={styles.footer(textInputColor)}>
          <View style={styles.textInp(textInputColor, maxHeight)}>
            {msg.trim() === "" ? (
              <>
                <TouchableOpacity
                  onPress={() => setIsSticker(true)}
                  style={styles.Button(theme, isConnected, 35, 35, 10)}
                  disabled={!isConnected || isLoading || !socket}
                >
                  <Image
                    source={Icons.sticker}
                    style={styles.Image(0, 0, 35, 35)}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => uploadFile(endPoint)}
                  style={styles.Button(theme, isConnected, 35, 35, 10)}
                  disabled={!isConnected || isLoading || !socket}
                >
                  <Image
                    source={Icons.upload}
                    style={styles.Image(0, 0, 35, 35)}
                  />
                </TouchableOpacity>
              </>
            ) : null}

            <TextInput
              placeholder="Type a message"
              placeholderTextColor={theme === "dark" ? "#E0E0E0" : "#2D2D2D"}
              style={styles.TextInput(theme)}
              readOnly={!isConnected || isLoading || !socket}
              multiline={true}
              numberOfLines={4}
              editable={isConnected && !isLoading && socket}
              onContentSizeChange={(e) => {
                if (
                  e.nativeEvent.contentSize.height > 50 &&
                  e.nativeEvent.contentSize.height < 60
                ) {
                  setMaxHeight(e.nativeEvent.contentSize.height);
                } else if (e.nativeEvent.contentSize.height > 60) {
                  setMaxHeight(60);
                } else {
                  setMaxHeight(50);
                }
              }}
              value={msg}
              onChangeText={(text) => {
                setMsg(text);
              }}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={styles.Button(theme, isConnected, 35, 35, 0, 10)}
              disabled={
                !isConnected || msg.trim() === "" || isLoading || !socket
              }
            >
              <Image
                source={Icons.sendBtn}
                style={styles.Image(0, 0, 35, 35)}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={isSticker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSticker(false)}
        hardwareAccelerated={true}
      >
        <StickerComponent />
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        hardwareAccelerated={true}
        visible={isFocused.focused}
      >
        <BlurItem isFocused={isFocused} />
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        hardwareAccelerated={true}
        visible={isAddUser}
      >
        <AddUserToGroup
          setIsAddUser={setIsAddUser}
          groupId={selectedContact}
          setCurrentContact={setSelectedContact}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default SingleChat;

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    backgroundColor: theme === "dark" ? "black" : "white",
    flexDirection: "column",
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
    flex: 0.15,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    maxHeight: 100,
  }),
  textInp: (color, height = 50) => ({
    height: height,
    width: "95%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: color.color,
    borderRadius: 30,
  }),
  TextInput: (theme) => ({
    minHeight: 50,
    flex: 1,
    padding: 15,
    color: theme === "dark" ? "#E0E0E0" : "#2D2D2D",
    fontWeight: "bold",
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
  flatListItem: (justifyContent = "flex-start") => ({
    padding: 0,
    backgroundColor: "transparent",
    margin: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: justifyContent,
  }),
  messageLeft: (isEmoji, theme) => ({
    backgroundColor: isEmoji
      ? "transparent"
      : theme === "dark"
      ? "rgba(0, 122, 255, 1)"
      : "rgba(0,255,0,0.8)", //theme==="dark"?"#388E3C":"#4CAF50"
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 5,
    minWidth: 50,
    maxWidth: "80%",
    marginRight: 10,
    flexDirection: "column",
  }),
  messageRight: (isEmoji, theme) => ({
    backgroundColor: isEmoji
      ? "transparent"
      : theme === "dark"
      ? "#1E1E1E"
      : "#E0E0E0",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 5,
    marginTop: 5,
    minWidth: 50,
    maxWidth: "80%",
    marginLeft: 10,
    flexDirection: "column",
  }),
  stickerModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  stickerContainer: () => ({
    height: "50%",
    width: "100%",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    zIndex: 10,
  }),
  stickerHeader: {
    height: "10%",
    width: "100%",
    backgroundColor: "transparent",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  stickers: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  rows: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    margin: 10,
  },
  ScrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
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
    width: 200,
    borderRadius: 20,
  }),
  blurText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "rgba(255,0,0,0.8)",
  },
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
});
