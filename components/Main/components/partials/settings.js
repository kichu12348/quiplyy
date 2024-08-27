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
import * as SQLlite from "expo-sqlite";
import axios from "axios";

const Settings = ({ navigation }) => {
  const theme = useTheme();
  const auth = useAuth();
  const sql = useSql();
  const socket = useSocket();
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  axios.defaults.baseURL = `${socket.endPoint}/message`;

  

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

  const BackupMessages = async () => {
    if (!socket.isConnected) {
      Alert.alert("No Internet Connection");
      return;
    }
    if (socket.isLoading) {
      Alert.alert("Please wait for the server to connect!");
      return;
    }
    const db = await SQLlite.openDatabaseAsync("messages.db");
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
    const rows = await db.getAllAsync("SELECT * FROM messages");
    if (rows.length === 0) {
      Alert.alert("No Messages to Backup");
      return;
    }
    await axios
      .post("/backup", { messages: rows, token: auth.token })
      .then((res) => {
        if (res.data.success) {
          Alert.alert("Messages Backed Up Successfully");
        } else {
          Alert.alert(
            "Error:",
            res.data.error.message || "Error Backing Up Messages"
          );
        }
      });
  };

  const getBackup = async () => {
    if (!socket.isConnected) {
      Alert.alert("No Internet Connection");
      return;
    }
    if (socket.isLoading) {
      Alert.alert("Please wait for the server to connect");
      return;
    }
    await axios
      .post("/getBackup", { token: auth.token })
      .then(async (res) => {
        if (res.data.success) {
          try {
            const db = await SQLlite.openDatabaseAsync("messages.db");
            await db.execAsync("DROP TABLE IF EXISTS messages");
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
            res.data.messages.map(async (message) => {
              await db.runAsync(
                `
          INSERT INTO messages (id, sender, msg, roomID, time, isSticker, sticker,isDeleted,isGroup,senderName,isImage,imageUri,isDownloaded) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `,
                [
                  message.id,
                  message.sender,
                  message.msg,
                  message.roomID,
                  message.isSticker,
                  message.sticker,
                  message.isDeleted,
                  message.time,
                  message.isGroup,
                  message.senderName,
                  message.isImage,
                  message.imageUri,
                  true,
                ]
              );
            });

            await axios
              .post("/deleteBackup", { token: auth.token })
              .then((res) => {
                if (res.data.success) {
                  Alert.alert("Messages Restored Successfully");
                  return;
                } else {
                  Alert.alert("Error: Restoring Messages");
                  return;
                }
              })
              .catch((e) => {
                Alert.alert("Error Restoring Messages");
              });
            return;
          } catch (e) {
            Alert.alert("Error Restoring Messages");
            return;
          }
        }
        Alert.alert(
          "Error: ",
          res.data.error.message || "Error Restoring Messages"
        );
      })
      .catch((e) => {
        Alert.alert("Error Restoring Messages");
      });
  };

  const BackupComponent = () => {
    return (
      <SafeAreaView style={styles.backUpcontainer(theme.theme)}>
        <View style={styles.backUpHeader}>
          <TouchableOpacity onPress={() => setIsBackupOpen(false)}>
            <Image source={theme.Icons.return} style={styles.Image(0)} />
          </TouchableOpacity>
          <Text style={styles.text(theme.theme === "dark" ? "white" : "black")}>
            Back
          </Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.backUpText}>
            ⚠️ downloading Backup will replace the current messages.....
          </Text>
          <View style={styles.centerDiv}>
            <TouchableOpacity
              style={styles.button(theme.theme)}
              onPress={() => BackupMessages()}
            >
              <Text style={styles.text("white")}>Backup Messages</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.centerDiv}>
            <TouchableOpacity
              style={styles.button(theme.theme)}
              onPress={() => getBackup()}
            >
              <Text style={styles.text("white")}>download Backup</Text>
            </TouchableOpacity>
          </View>
        </View>
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

        <Text style={styles.text(theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D")}>
          Settings
        </Text>
      </View>
      <ScrollView style={styles.scrollView}>
        
        <View style={styles.center}>
          <View style={styles.middle("space-between","row","center",20,theme)}>
          <Text style={styles.text(theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D")}>
            {auth.user ? auth.user.username : "User"}
          </Text>
          <Image
            source={
              auth.user
                ? {
                    uri: `https://api.multiavatar.com/${auth.user.username}.png?apikey=CglVv3piOwAuoJ`,
                  }
                : theme.Icons.setting
            }
            style={styles.Image(10, 20)}
          />
        </View>
        <View style={styles.middle("space-between", "row", "flex-start",20,theme)}>
          <Text style={styles.text(theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D")}>
            Dark Mode
          </Text>
          <Switch
          trackColor={{ false: "#E0E0E0", true: "rgba(0,255,0,0.8)" }}
          thumbColor={"#E0E0E0"}
          value={theme.theme === "dark"}
          onValueChange={() => theme.themeSetting(theme.theme === "dark" ? "light" : "dark")}
          />
        </View>
        {/* <View style={styles.middle("space-between", "column", "flex-start",20,theme)}>
          <Text style={styles.text(theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D")}>
            Chat Background
          </Text>
          <ScrollView 
          style={styles.container()}
          horizontal={true}
          >
            {theme.chatTheme.map(c=>{
              return(
                <TouchableOpacity
                onPress={()=>theme.setCurrentChatImage(c)}
                style={styles.Image(10,0,5,100,100)}
                key={c.statusBarColor}
                >
                  <Image source={c.image} style={styles.Image(0,0,5,100,100)}/>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View> */}


        <View style={styles.middle("center", "column", "center", 0,theme)}>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.rowBtn(theme.theme)}
            onPress={() => checkForUpdate()}
          >
            <Text style={styles.text("white")}>Check For Update</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.rowBtn(theme.theme)}
            onPress={() => setIsBackupOpen(true)}
          >
            <Text style={styles.text("white")}>Backup</Text>
          </TouchableOpacity> */}
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
          visible={isBackupOpen}
          animationType="slide"
          hardwareAccelerated={true}
        >
          <BackupComponent />
        </Modal>
        <View style={styles.connectionDet}>
          <Text
            style={styles.text(theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D", 15)}
          >
            Connected:{" "}
            {socket.isConnected && socket.socket ? "Yes" : "No"}
          </Text>
          {socket.isConnected && socket.socket ? (
            <Text
              style={styles.text(
                theme.theme === "dark" ? "#E0E0E0" : "#2D2D2D",
                15
              )}
            >connection id: {" "}
              {socket.socket?.id}
            </Text>
          ) : null}
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
  text: (color, fts = 20) => ({
    color: color,
    fontSize: fts,
    fontWeight: "bold",
    alignSelf: "center",
  }),
  header: () => ({
    height: 50,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 20,
  }),
  Image: (marginR = 0, marginL = 0,borderRadius=20,height=40,width=40) => ({
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
  ) => (
    {
    flexDirection: flexDirection,
    justifyContent: justifyContent,
    alignItems: alignItems,
    backgroundColor: "transparent",
    marginTop: 20,
    width: "90%",
    minHeight: 50,
    padding: 15,
    backgroundColor: theme.theme=== "dark"?"#212121":"#e0e0e0",
    borderRadius: 25,
  }),
  SelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 0,
    marginTop: 10,
  },
  circle: (color = "white", theme) => ({
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: color,
    marginHorizontal: 20,
    opacity: theme ? 1 : 0,
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
  backUpcontainer: (theme) => ({
    flex: 1,
    backgroundColor: theme === "dark" ? "black" : "white",
    justifyContent: "center",
    alignItems: "center",
  }),
  body: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  backUpHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "transparent",
    width: "100%",
    marginTop: 20,
    marginLeft: 20,
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
  backUpText: {
    fontSize: 15,
    fontWeight: "400",
    marginVertical: 20,
    color: "red",
  },
  connectionDet: {
    minHeight: 100,
    flexDirection: "column",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  }
});
