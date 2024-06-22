import {
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    KeyboardAvoidingView,
    TouchableOpacity,
    Platform,
    Image,
    Alert
  } from "react-native";
  import { useState } from "react";
  import ionTron from './images/ionTron.png'
  import { StatusBar } from "expo-status-bar";
  import { useAuth } from "../../contexts/authContext";

const Login = ({navigation}) => {

    const handleMovePage =()=>{
        navigation.navigate("signup")
    }

    //states
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const Auth = useAuth()


    const handleLogin =()=>{
        if(username==="" || password==="" || username===undefined || password===undefined || username.trim()==="" || password.trim()===""|| username.length<4 || password.length<4){
            Alert.alert("Fill the fields")
          return
        }
        Auth.login(username, password)
    }

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar behavior="light" backgroundColor="black"/>
      <KeyboardAvoidingView
        style={styles.KeyboardAvoidingView("center")}
        behavior={Platform.OS==="ios"?"padding":"height"}
        keyboardVerticalOffset={Platform.OS==="ios"?-150:0}
      >
        <Image
        source={ionTron}
        style={styles.Image}
        />
        <TextInput
         style={styles.TextInput} 
        placeholder="username..."
        placeholderTextColor={"rgba(255,255,255,0.5)"}
        value={username}
        onChangeText={(text)=>setUsername(text)}
         />
        <TextInput 
        style={styles.TextInput} 
        placeholder="password.." 
        value={password}
        onChangeText={(text)=>setPassword(text)}
        placeholderTextColor={"rgba(255,255,255,0.5)"}
        secureTextEntry
        onSubmitEditing={handleLogin}
        />
        <TouchableOpacity style={styles.textStyle("white", 0, 10)} 
        onPress={handleMovePage}
        >
          <Text style={styles.textStyle()}>
            New user ?{" "}
            <Text style={styles.textStyle("purple")}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
        style={styles.button}
        onPress={handleLogin}
        >
          <Text style={styles.textStyle()}>Login</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:"rgba(0,0,0,1)"
  },
  textStyle: (color = "white", marginT = 0, marginB = 0) => ({
    color: color,
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: marginB,
    marginTop: marginT,
  }),
  KeyboardAvoidingView: (justifyContent) => ({
    flex: 1,
    flexDirection: "column",
    justifyContent: justifyContent,
    alignItems: "center",
  }),
  TextInput: {
    width: "80%",
    height: 50,
    backgroundColor: "rgba(68, 68, 68, 0.8)",
    padding: 10,
    borderRadius: 20,
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 10,
    color: "white",
  },
  button: {
    height: 50,
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(128,0,128,0.8)",
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "purple",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
        backgroundColor: "rgba(128,0,128,0.8)",
      },
    }),
  },
  Image:{
    height:60,
    width:60,
    marginBottom:10
}
});
