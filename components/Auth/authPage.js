import { View, Text,StyleSheet} from 'react-native'
import {useEffect} from 'react'
import Login from './login'
import SignUp from './signUp'
import { createStackNavigator } from '@react-navigation/stack'
import { StatusBar } from 'expo-status-bar'
import {useSocket} from '../../contexts/socketContext'




const Auth = ({navigation}) => {
  const Stack = createStackNavigator()
  const {isAuth,isLoading} = useSocket()

  useEffect(()=>{
    if(!isLoading && isAuth){
      navigation.replace("homePage")
    }
  },[isLoading,isAuth])


  return (
    <View style={styles.container}>
      <StatusBar behavior="dark" backgroundColor="black"/>
      <Stack.Navigator>
        <Stack.Screen
        name='login'
        component={Login}
        options={{
          header:()=>null
        }}
        style={styles.Bg}
        />
        <Stack.Screen
        name='signup'
        component={SignUp}
        options={{
          header:()=>null
        }}
        />
      </Stack.Navigator>
    </View>
  )
}

export default Auth

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  Bg:{
    backgroundColor:"transparent"
  }
})