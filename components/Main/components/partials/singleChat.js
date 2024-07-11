import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  FlatList,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import * as SQLite from "expo-sqlite";
import { useTheme } from "../../../../contexts/theme";
import { useMessager } from "../../../../contexts/messagerContext";
import { useSocket } from "../../../../contexts/socketContext";
import { useAuth } from "../../../../contexts/authContext";
import { BlurView } from "expo-blur";
import LongPressComponent from "./utils/longPress";

const SingleChat = ({ navigation }) => {
  const { theme, Icons, chatColor } = useTheme();
  const { selectedContact, randomUID } = useMessager();
  const { socket, isConnected, isLoading, endPoint, stickerList } = useSocket();
  const { user, token } = useAuth();

  axios.defaults.baseURL = `${endPoint}/message`;

  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSticker, setIsSticker] = useState(false);
  const [isFocused, setIsFocused] = useState({ focused: false, item: null });
  const [isTyping, setIsTyping] = useState(false);
  const [stickers, setStickers] = useState([]);
  const receivedMessageIds = useRef(new Set());

  let loaded = false;

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
        time TEXT
      );
    `);
  };

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
      await db.runAsync("DELETE FROM messages WHERE id = ?", [message.id]);
      setMessages((prev) => prev.filter((e) => e.id !== message.id));
      return;
    }
    if (message.isSticker) {
      await db.runAsync(
        "INSERT INTO messages (id, sender, msg, roomID, time, isSticker, sticker,isDeleted,isGroup,senderName) VALUES (?,?,?,?,?,?,?,?,?,?)",
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
        ]
      );
      return;
    }
    await db.runAsync(
      `INSERT INTO messages (id, sender, msg, roomID, time,isSticker, sticker,isDeleted,isGroup,senderName) VALUES (?, ?, ?, ?, ?,?,?,?,?,?)`,
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
      ]
    );
  };

  const handleIncomingMessage = useCallback(
    async (message) => {
      if (!isConnected || !selectedContact || message.sender === user.id)
        return;
      const db = await dbPromise;
      if (message.isDeleted) {
        if (user.id === message.sender) return;
        if (receivedMessageIds.current.has(message.id)) {
          receivedMessageIds.current.delete(message.id);
          console.log("delete");
          await addMessageToDB(db, message);
        }

        await axios.post("/delete", {
          messageId: message.id,
          isGroup: selectedContact.isGroup,
          noOfMembers: selectedContact.noOfMembers,
          sender: message.sender,
          token
        });
        return;
      }

      if (!receivedMessageIds.current.has(message.id)) {
        receivedMessageIds.current.add(message.id);
        await addMessageToDB(db, message);
        setMessages((prev) => [...prev, message]);
        await axios.post("/delete", {
          messageId: message.id,
          isGroup: selectedContact.isGroup,
          noOfMembers: selectedContact.noOfMembers,
          sender: message.sender,
        });
      }
    },
    [isConnected, selectedContact, user.id]
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
        isGroup: selectedContact.isGroup,
        noOfMembers: selectedContact.noOfMembers,
        token,
      });
      if (res.data.success) {
        for (const message of res.data.messages) {
          if (
            message.sender !== user.id &&
            !receivedMessageIds.current.has(message.id)
          ) {
            handleIncomingMessage(message);
          }
          if(message.sender !==user.id
            && receivedMessageIds.current.has(message.id)
            && message.isDeleted
          ){
            handleIncomingMessage(message);
          }
        }
      }
    } catch (e) {
      console.log("error: check message: ", e.message);
    }
  };

  useEffect(() => {
    startChat();
    if (stickerList.length !== 0) {
      setStickers(stickerList);
    }
  }, [selectedContact, isConnected]);

  const sendSticker = async (sticker) => {
    if (!isConnected || !selectedContact) return;

    const message = {
      id: randomUID(),
      sender: user.id,
      senderName: user.username,
      msg: "",
      roomID: selectedContact.roomID,
      time: new Date().toISOString(),
      isSticker: true,
      sticker: sticker,
      isDeleted: false,
      isGroup: selectedContact.isGroup,
      noOfMembers: selectedContact.noOfMembers,
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
      sender: user.id,
      senderName: user.username,
      msg: msg,
      roomID: selectedContact.roomID,
      time: new Date().toISOString(),
      isSticker: false,
      sticker: null,
      isDeleted: false,
      isGroup: selectedContact.isGroup,
      noOfMembers: selectedContact.noOfMembers,
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
      sender: user.id,
      senderName: user.username,
      msg: "",
      roomID: selectedContact.roomID,
      time: new Date().toISOString(),
      isSticker: false,
      sticker: null,
      isDeleted: true,
      isGroup: selectedContact.isGroup,
      noOfMembers: selectedContact.noOfMembers,
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
        if (id === user.id) return;
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
    if (item.sender !== user.id) return;
    if (state) {
      setIsFocused({ focused: true, item: item });
    }
  };

  const isTypingHandler = (text) => {
    if (!isConnected || !selectedContact || !socket) return;
    if (text.trim() === "") return;
    socket?.emit("typing", { roomID: selectedContact.roomID, user: user.id });
  };

  //components
  const RenderList = ({ item }) => {
    return (
      <View
        style={styles.flatListItem(
          item.sender === user.id ? "flex-end" : "flex-start"
        )}
      >
        <LongPressComponent
          key={item?.id}
          onLongPress={(state) => longPressEventHandle(state, item)}
          time={500}
        >
          <View
            style={
              item.sender === user.id
                ? styles.messageLeft(
                    item.isSticker ? true : isOnlyEmojis(item.msg),
                    chatColor
                  )
                : styles.messageRight(
                    item.isSticker ? true : isOnlyEmojis(item.msg),
                    chatColor
                  )
            }
          >
            {item.isSticker ? (
              <>
                {item.isGroup && item.sender !== user.id ? (
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
                <Image
                  source={{ uri: `${endPoint}/stickers/${item.sticker}` }}
                  style={styles.Image(
                    item.sender === user.id ? 0 : -10,
                    item.sender === user.id ? -10 : 0,
                    200,
                    200,
                    10
                  )}
                />
              </>
            ) : (
              <>
                {item.isGroup && item.sender !== user.id ? (
                  <Text
                    style={styles.textStyles(theme, 12, "400", "white", 0.8)}
                  >
                    {item.senderName}
                  </Text>
                ) : null}
                <Text
                  style={styles.textStyles(
                    theme,
                    isOnlyEmojis(item.msg) ? 60 : 18,
                    "400",
                    "white"
                  )}
                >
                  {item.msg}
                </Text>
              </>
            )}
          </View>
        </LongPressComponent>
      </View>
    );
  };

  const rowLength =
    stickers.length % 3 === 0
      ? stickers.length / 3
      : Math.floor(stickers.length / 3) + 1;

  const StickerComponent = () => {
    return (
      <TouchableWithoutFeedback onPress={() => setIsSticker(false)}>
        <View style={styles.stickerModal}>
          <BlurView intensity={300} style={styles.stickerContainer()}>
            <View style={styles.stickerHeader}>
              <TouchableOpacity
                style={styles.Image(10, 20, 40, 40)}
                onPress={() => setIsSticker(false)}
              >
                <Image
                  source={Icons.return}
                  style={styles.Image(10, 20, 40, 40)}
                  onPress={() => setIsSticker(false)}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.stickers}>
              <ScrollView scrollEnabled={true} style={styles.ScrollView}>
                {stickers.length > 0
                  ? (() => {
                      const stickerItems = [];
                      for (let index = 0; index < rowLength; index++) {
                        const stickerRow = [
                          stickers[index * 3],
                          stickers[index * 3 + 1] || null,
                          stickers[index * 3 + 2] || null,
                        ];

                        stickerItems.push(
                          <View key={`row-${index}`} style={styles.rows}>
                            <StickerItem stickers={stickerRow} />
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

  const StickerItem = ({ stickers }) => {
    return (
      <>
        {stickers.map((sticker, index) => {
          return sticker ? (
            <TouchableOpacity
              key={sticker.id}
              onPress={() => sendSticker(sticker.name)}
            >
              <Image
                source={{ uri: `${endPoint}/stickers/${sticker.name}` }}
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

  const flatListRef = useRef(null);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      if (loaded) return;
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container(theme)}>
      <View style={styles.header(theme)}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.Image(10, 20)}
        >
          <Image source={Icons.return} style={styles.Image()} />
        </TouchableOpacity>

        <Text style={styles.textStyles(theme)}>
          {selectedContact ? selectedContact?.username : "Single Chat"}
        </Text>
        {!selectedContact.isGroup ? (
          <Image
            source={{
              uri: `https://api.multiavatar.com/${selectedContact.username}.png?apikey=CglVv3piOwAuoJ`,
            }}
            style={styles.Image(20, 10)}
          />
        ) : null}
      </View>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 5}
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
        <View style={styles.footer}>
          <View style={styles.updateContainer}>
            <Text
              style={styles.textStyles(theme, 15, 400, "rgba(198,198,198,0.5)")}
            >
              {isTyping ? "Typing..." : ""}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsSticker(true)}
            style={styles.Button(theme, isConnected, 40, 40, 10)}
            disabled={!isConnected || isLoading || !socket}
          >
            <Image source={Icons.sticker} style={styles.Image(0, 0, 40, 40)} />
          </TouchableOpacity>
          <TextInput
            placeholder="Type a message"
            placeholderTextColor={theme === "dark" ? "white" : "black"}
            style={styles.TextInput(theme)}
            readOnly={!isConnected || isLoading || !socket}
            value={msg}
            onChangeText={(text) => {
              setMsg(text);
              isTypingHandler(text);
            }}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={styles.Button(theme, isConnected, 45, 45, 0, 10)}
            disabled={!isConnected || msg.trim() === "" || isLoading || !socket}
          >
            <Image source={Icons.sendBtn} style={styles.Image(0, 0, 45, 45)} />
          </TouchableOpacity>
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
    color = theme === "dark" ? "white" : "black",
    opacity = 1
  ) => ({
    color: color,
    fontSize: fontSize,
    fontWeight: fontWeight,
    opacity: opacity,
  }),
  header: (theme) => ({
    height: 50,
    width: "100%",
    backgroundColor: "transparent",
    marginTop: 30,
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
    height = 50,
    width = 50,
    borderRadius = 0
  ) => ({
    height: height,
    width: width,
    marginLeft: marginLeft,
    marginRight: marginR,
    borderRadius: borderRadius,
  }),
  body: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  flatListContainer: {
    flex: 1,
  },
  footer: {
    flex: 0.15,
    width: "100%",
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    minHeight: 50,
    maxHeight: 100,
  },
  TextInput: (theme) => ({
    height: 50,
    flex: 1,
    backgroundColor:
      theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
    borderRadius: 25,
    borderBlockColor:
      theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    borderWidth: 0.5,
    padding: 15,
    margin: 5,
    color: theme === "dark" ? "white" : "black",
    fontWeight: "bold",
    justifyContent: "center",
    alignItems: "center",
    alignText: "center",
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
  messageLeft: (isEmoji, chatColor) => ({
    backgroundColor: isEmoji ? "transparent" : chatColor.sender,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 5,
    minWidth: 50,
    maxWidth: "80%",
    marginRight: 10,
    flexDirection: "column",
  }),
  messageRight: (isEmoji, chatColor) => ({
    backgroundColor: isEmoji ? "transparent" : chatColor.receiver,
    borderRadius: 10,
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
});
