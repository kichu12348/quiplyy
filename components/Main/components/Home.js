import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";
import SafeAreaView from "./partials/utils/safe";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import { useEffect, useState } from "react";
import Chats from "./partials/chats";
import Stuff from "./partials/stuff";
import Blog from "./partials/blogs";
import Settings from "./partials/settings";
import SingleChat from "./partials/singleChat";
import ChessJs from "./partials/chess";
import AiChat from "./partials/aiChat";
import { useTheme } from "../../../contexts/theme";
import { useAuth } from "../../../contexts/authContext";
import { useSocket } from "../../../contexts/socketContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const Home = ({ navigation }) => {
  const Stack = createStackNavigator();

  const theme = useTheme();
  const auth = useAuth();
  const socket = useSocket();

  // AI model setup
  const genAI = new GoogleGenerativeAI(
    "AIzaSyBOTCMRvTiPh5Ymole_TBaM5dHHPla1K24"
  );

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  const generationConfig = {
    temperature: 0.5,
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings,
    generationConfig,
  });

  async function generateText() {
    const { response } = await model.generateContent(
      `you are supposed to send a random happy,funny,caring,blush type or a super cheesy pickup line 👀 or any type of message that can make one smile or laugh or feel good about themselves no insulting stuff, use emojis as much as possible. the user is: ${auth.user?.username}. Max length of the message should be 300 characters.`
    );
    const result = await response.text();
    return result.trim();
  }

  const height = useSharedValue(0);
  const opacity = useSharedValue(0); // For smooth opacity transition
  const { width } = Dimensions.get("window");
  const [isVisible, setIsVisible] = useState(false);
  const [text, setText] = useState("");

  // Smooth animation styles for height and opacity
  const animatedStyle = useAnimatedStyle(() => ({
    minHeight: height.value,
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    setIsVisible(true);
    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
    height.value = withTiming(175, {
      duration: 400,
      easing: Easing.out(Easing.exp),
    });
  };

  const startNotif = async () => {
    const txt = await generateText();
    setText(txt);
    startAnimation();
  };

  const resetAnimation = () => {
    opacity.value = withTiming(0, {
      duration: 500,
      easing: Easing.in(Easing.exp),
    });
    height.value = withTiming(0, {
      duration: 400,
      easing: Easing.in(Easing.exp),
    });
    setTimeout(() => {
      setIsVisible(false);
    }, 500);
  };

  useEffect(() => {
    if (auth.user && socket.isConnected && !isVisible) {
      setTimeout(() => startNotif(), 8000);
    }
  }, [auth.user, socket.isConnected]);

  useEffect(() => {
    if (!socket.isAuth && !socket.isLoading) {
      navigation.replace("authPage");
    } else if (!socket.isAuth && socket.isLoading) {
      navigation.replace("LoadingPage");
    }
  }, [auth.token, socket.isAuth]);

  return (
    <SafeAreaView>
      <Animated.View style={[styles.topContainer, animatedStyle]}>
        {isVisible && (
          <TouchableOpacity onPress={resetAnimation}>
            <View style={styles.notifBox(theme, width * 0.9)}>
              <Text style={styles.textStyles(theme.theme)}>{text}</Text>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>
      <Stack.Navigator
        initialRouteName="Chats"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          ...TransitionPresets.SlideFromRightIOS,
        }}
      >
        <Stack.Screen name="Chats" component={Chats} />
        <Stack.Screen name="Stuff" component={Stuff} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="SingleChat" component={SingleChat} />
        <Stack.Screen name="blogPage" component={Blog} />
        <Stack.Screen name="ChessJs" component={ChessJs} />
        <Stack.Screen name="AiChat" component={AiChat} />
      </Stack.Navigator>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  topContainer: {
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 10,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  notifBox: (theme = "dark", w) => ({
    width: w,
    alignItems: "center",
    minHeight: 75,
    justifyContent: "center",
    backgroundColor: theme.theme === "dark" ? "#2D2D2D" : "#E0E0E0",
    padding: 10,
    borderRadius: 30,
    borderWidth: 0.5,
    borderColor: theme.textInputColor.border,
  }),
  textStyles: (theme = "dark") => ({
    color: theme === "dark" ? "#E0E0E0" : "#2D2D2D",
    fontSize: 16,
    fontWeight: "400",
  }),
});
