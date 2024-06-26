import { View,StyleSheet,Image,TouchableOpacity} from 'react-native'
import React from 'react'
import { useTheme } from '../../../../contexts/theme'
import { useAuth } from '../../../../contexts/authContext'

const Footer = ({moveTo}) => {


  const {Icons,theme}=useTheme()
  const {user}=useAuth()

  return (
    <View style={styles.container(theme)}>
      <TouchableOpacity
      onPress={()=>moveTo('Stuff')}
      >
        <Image style={styles.Image} source={Icons.stuff}/>
      </TouchableOpacity>
      <TouchableOpacity
      onPress={()=>moveTo('blogPage')} 
      >
        <Image style={styles.Image} source={Icons.blog}/>
      </TouchableOpacity>
      <View>
        <Image style={styles.Image} source={user?({uri:`https://api.multiavatar.com/${user.username}.png?apikey=CglVv3piOwAuoJ`}):Icons.chat}/>
      </View>
      <TouchableOpacity
      onPress={()=>moveTo('Settings')}
      >
        <Image style={styles.Image} source={Icons.setting}/>
      </TouchableOpacity>
    </View>
  )
}

export default Footer

const styles=StyleSheet.create({
    container:(color)=>({
        flex:0.15,
        backgroundColor:color==="dark"?"black":"white",
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-evenly",
    }),
    Image:{
        height:40,
        width:40,
        alignSelf:"center",
    }
})