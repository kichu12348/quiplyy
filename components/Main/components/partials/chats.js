import { View, Text,StyleSheet, SafeAreaView} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useTheme } from '../../../../contexts/theme'
import React from 'react'
import Footer from './footer'
import Body from './body'

const Chats = ({navigation}) => {
    const moveTo=(screen)=>{
        navigation.navigate(screen)
    }
    const theme = useTheme()




  return (
    <SafeAreaView style={styles.container}>
        <StatusBar style={theme.theme==="dark"?"light":"dark"} backgroundColor={theme.theme==="dark"?"black":"white"}  translucent/>
        <Body moveTo={moveTo}/>
        <Footer moveTo={moveTo}/>
    </SafeAreaView>
  )
}

export default Chats

const styles=StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:"black",
        flexDirection:"column"
    }
})