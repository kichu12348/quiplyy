import { useState } from "react";
import { useTheme } from "../../../../contexts/theme";
import { useSocket } from "../../../../contexts/socketContext";
import {
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Text,
  StyleSheet,
  View,
  Platform,
  Alert,
} from "react-native";
import SafeAreaView from "./utils/safe";

const AddBlogs = ({ setIsAddBlog, supabase,setBlogs }) => {
  const { theme, Icons, chatColor } = useTheme();
  const {isConnected} = useSocket();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const addBlog = async () => {
    if (title.trim() === "" || body.trim() === "") return;
    if(!supabase) return;
    if(title.length < 6 || body.length < 6) {
        Alert.alert("Title and body must be at least 6 characters long");
        return;
    }
    const {error} = await supabase.from("blogs").insert([{title,body}]);
    if(error){
      console.log(error);
    }
    else{
      setIsAddBlog(false);
      setBlogs(prev=>[...prev,{id:prev.length,title,body}])
    }
}


  return (
    <TouchableWithoutFeedback
      style={styles.flex1}
      onPress={() => Keyboard.dismiss()}
    >
      <SafeAreaView style={styles.container(theme)}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton()}
            onPress={() => {
              setIsAddBlog(false);
            }}
          >
            <Image source={Icons.return} style={styles.backIcon} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.KeyboardAvoidingView}
        >
          <TextInput
            style={styles.textInput(theme, 50)}
            placeholder="Title...."
            placeholderTextColor={theme === "dark" ? "white" : "black"}
            value={title}
            onChangeText={(text) => setTitle(text)}
            readOnly={!isConnected}
          />
          <TextInput
            style={styles.textInput(theme, "15%", "flex-start")}
            placeholder="content...."
            placeholderTextColor={theme === "dark" ? "white" : "black"}
            multiline={true}
            numberOfLines={10}
            value={body}
            onChangeText={(text) => setBody(text)}
            readOnly={!isConnected}
          />
          <TouchableOpacity style={styles.Button(chatColor)} onPress={addBlog}>
            <Text style={styles.textStyles(theme)}>Add Blog</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default AddBlogs;

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    backgroundColor: theme === "dark" ? "black" : "white",
    justifyContent: "center",
    alignItems: "center",
  }),
  textStyles: (theme, fontSize = 20, fontWeight = "bold") => ({
    color: theme === "dark" ? "white" : "black",
    fontSize: fontSize,
    fontWeight: fontWeight,
  }),
  header: {
    height: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  textInput: (theme, height, textAlign = "flex-start") => ({
    borderRadius: 15,
    minHeight: height,
    maxHeight: "30%",
    width: "90%",
    marginBottom: 10,
    padding: 10,
    textAlign: textAlign,
    color: theme === "dark" ? "white" : "black",
    backgroundColor: theme === "dark" ? "rgba(30,30,30,0.8)" : "rgba(255,255,255,0.8)",
  }),
  KeyboardAvoidingView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  Button: (chatColor) => ({
    width: "90%",
    height: 40,
    backgroundColor: chatColor.sender,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: chatColor.sender,
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
        shadowColor: chatColor.sender,
      },
    }),
  }),
  flex1: {
    flex: 1,
  },
  backButton: (marginR = 0) => ({
    marginLeft: 10,
    marginRight: marginR,
  }),
  backIcon: {
    height: 40,
    width: 40,
  },
});
