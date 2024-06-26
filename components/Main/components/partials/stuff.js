import { SafeAreaView, Text,StyleSheet,View,TouchableOpacity,Image} from 'react-native'
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
      </View>
      <Music />
    </SafeAreaView>
  )
}

export default Stuff

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    backgroundColor: theme === "dark" ? "black" : "white",
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
    marginTop: 20,
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
})