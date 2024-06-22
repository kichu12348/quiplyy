import { Text, StyleSheet, View, Image } from "react-native";
import {useEffect} from "react";
import floatingBot from "./images/floatingBoot.gif";
import { useSocket } from "../../contexts/socketContext";

const Loading = ({navigation}) => {
    
    const socket= useSocket()

    useEffect(()=>{
        if(!socket.isLoading && socket.isAuth && socket.isConnected){
            navigation.replace("homePage")
        }
        else if(!socket.isLoading && !socket.isAuth){
            navigation.replace("authPage")
        }
        else if(socket.isAuth && !socket.isConnected){
            navigation.replace("homePage")
        }
    },[socket.isLoading,socket.isAuth,socket.isConnected])



  return (
    <View style={styles.container}>
        <Image style={styles.Image} source={floatingBot}/>
      <Text style={styles.textStyle}>Server is Loading...</Text>
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  Image: {
    height:300,
    width: 300,
    alignSelf:"center",
    marginLeft:"20%"
  },
  textStyle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },
});
