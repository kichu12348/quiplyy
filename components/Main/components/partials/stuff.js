import {Text,StyleSheet,View,TouchableOpacity,Image} from 'react-native'
import SafeAreaView from './utils/safe'
import React from 'react'
import Music from './musicPlayer'
import { useTheme } from '../../../../contexts/theme'

const Stuff = ({navigation}) => {

  const {theme,Icons} = useTheme()
  return (
    <SafeAreaView style={styles.container(theme)} >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image source={Icons.return} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.title(theme)}>Stuff</Text>
        <View style={styles.chessBox}>
          <TouchableOpacity onPress={()=>navigation.navigate('ChessJs')}>
          <Image source={Icons.chess} style={styles.backIcon} />
          </TouchableOpacity>
        </View>
      </View>
      <Music />
    </SafeAreaView>
  )
}

export default Stuff

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    backgroundColor: theme==="dark"?"#212121":"#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  }),
  textStyles: (theme) => ({
    color: theme === "dark" ? "white" : "black",
    fontSize: 20,
    fontWeight: "bold",
  }),
  header: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: (theme) => ({
    color: theme === 'dark' ? 'white' : 'black',
    fontSize: 30,
    fontWeight: 'bold',
    marginLeft: 20,
  }),
  backButton: {
    marginLeft: 10,
  },
  backIcon: {
    height: 40,
    width: 40,
  },
  chessBox:{
    flex:1,
    justifyContent:'center',
    alignItems:'flex-end',
    paddingRight:10
  }
})