import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import {useState} from "react";
import { useTheme } from "../../../../contexts/theme";
import { useAuth } from "../../../../contexts/authContext";
import { useSql } from "../../../../contexts/sqlContext";
import * as Updates from "expo-updates";
import { TextInput } from "react-native-gesture-handler";
import { useSocket } from "../../../../contexts/socketContext";

const Settings = ({ navigation }) => {
  const theme = useTheme();
  const auth = useAuth();
  const sql = useSql();
  const socket = useSocket();
  const[sender,setSender]=useState(theme.chatColor.sender)
  const[receiver,setReceiver]=useState(theme.chatColor.receiver)


  const changeColor=()=>{
    if(sender===""||receiver==="") return;
    if(sender===theme.chatColor.sender&&receiver===theme.chatColor.receiver) return;
    if(!sender.includes("rgba")||!receiver.includes("rgba")){
      Alert.alert("Invalid Color Only RGBA values are allowed");
      return;
    }
    theme.changeChatColor(sender,receiver);
  }

  const checkForUpdate = async () => {
    if(!socket.isConnected) return;
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


  const Selector = ({ state }) => {
    return (
      <TouchableOpacity
        style={styles.SelectorContainer}
        onPress={() => theme.themeSetting(state.toLowerCase())}
      >
        <View
          style={styles.circle(
            theme.theme === "dark" && state === "Dark" ? "white" : "black",
            theme.theme === state.toLowerCase()
          )}
        ></View>
        <Text style={styles.text(theme.theme === "dark" ? "white" : "black")}>
          {state}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={styles.container(theme.theme === "dark" ? "black" : "white")}
    >
      <View style={styles.header()}>
        <TouchableOpacity
          style={styles.Image(10)}
          onPress={() => navigation.goBack()}
        >
          <Image source={theme.Icons.return} style={styles.Image(0)} />
        </TouchableOpacity>

        <Text style={styles.text(theme.theme === "dark" ? "white" : "black")}>
          Settings
        </Text>
      </View>
      <View style={styles.middle()}>
        <Text style={styles.text(theme.theme === "dark" ? "white" : "black")}>
          {auth.user?auth.user.username:"User"} 
        </Text>
        <Image source={auth.user?({uri:`https://api.multiavatar.com/${auth.user.username}.png?apikey=CglVv3piOwAuoJ`}):theme.Icons.setting} style={styles.Image(10, 20)} />
      </View>
      <View style={styles.middle("center", "column", "flex-start", 30)}>
      <Text style={styles.text(theme.theme === "dark" ? "white" : "black")}>
          Color Picker
        </Text>
        <View style={styles.centerDiv}>
          <TextInput 
          style={styles.TextInput(theme,true)}
          value={sender}
          onChangeText={(text)=>setSender(text)}
          onSubmitEditing={changeColor}
          />
          <TextInput
          style={styles.TextInput(theme,false)}
          value={receiver}
          onChangeText={(text)=>setReceiver(text)}
          onSubmitEditing={changeColor}
          />
        </View>
      </View>
      <View style={styles.middle("center", "column", "flex-start")}>
        <Text style={styles.text(theme.theme === "dark" ? "white" : "black")}>
          Themes
        </Text>
        <Selector state="Dark" />
        <Selector state="Light" />
      </View>
      <View style={styles.middle("center", "column", "flex-start", 30)}>
        <Text style={styles.text(theme.theme === "dark" ? "white" : "black")}>
          Updates
        </Text>
        <View style={styles.centerDiv}>
          <TouchableOpacity
            style={styles.button(theme.theme)}
            onPress={()=>checkForUpdate()}
          >
            <Text style={styles.text("white")}>Check For Update</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.middle("center", "column", "flex-start", 0)}>
        <View style={styles.centerDiv}>
          <TouchableOpacity 
          style={styles.button(theme.theme)}
          onPress={() => {
            auth.logOut()
            sql.dropContactsDB()
          }}
          >
            <Text style={styles.text("white")}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: (bg) => ({
    flex: 1,
    backgroundColor: bg,
    flexDirection: "column",
  }),
  text: (color) => ({
    color: color,
    fontSize: 20,
    fontWeight: "bold",
  }),
  header: () => ({
    height: 50,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 20,
  }),
  Image: (marginR = 0, marginL = 0) => ({
    height: 40,
    width: 40,
    marginRight: marginR,
    marginLeft: marginL,
  }),
  middle: (
    justifyContent = "flex-end",
    flexDirection = "row",
    alignItems = "center",
    marginTop = 20
  ) => ({
    flexDirection: flexDirection,
    justifyContent: justifyContent,
    alignItems: alignItems,
    backgroundColor: "transparent",
    marginTop: marginTop,
    marginLeft: 20,
    minHeight: 50,
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
  button: (theme,opacity=1) => ({
    backgroundColor:
      theme === "dark" ? "rgba(198,0,198,1)" : "rgba(0,255,0,0.8)",
    height: 50,
    width: "60%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 20,
    opacity:opacity
  }),
  centerDiv: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  TextInput:(theme,state)=>({
    flex  :1,
    height:50,
    backgroundColor:state?theme.chatColor.sender:theme.chatColor.receiver,
    borderRadius:25,
    padding:10,
    margin:10,
    marginTop:20,
    color:"white",
    fontWeight:"bold"
  })
});
