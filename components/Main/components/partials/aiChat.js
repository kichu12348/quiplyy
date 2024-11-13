import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../../../contexts/theme";
import SafeAreaView from "./utils/safe";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { useAuth } from "../../../../contexts/authContext";
import { useSocket } from "../../../../contexts/socketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RotatingGradientRing from "./utils/animBg";
import RenderList from "./chatComps/aiChatRenderList";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import Icon from "./utils/icons";

export default function AiChat({ navigation }) {
  const {theme, textInputColor } = useTheme();
  const { isConnected } = useSocket();
  const { user, messages, setMessages } = useAuth();
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [responses, setResponses] = useState(0);
  const [personality, setPersonality] = useState(null);

  const genAI = new GoogleGenerativeAI(
    "AIzaSyDJejl17d53lZO8Tnl-vv7nwDWG8bQDA9Y"
  );

  const reset = () => {
    setMessages([]);
    setResponses(0);
  };

  // AI model
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

  const flatListRef = useRef();

  // Updated personalization function
  async function personalization() {
    try {
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [
              {
                text: `
                Analyze the conversation history and determine a concise personality profile for ${user.username}. 
                Describe it in third-person perspective, under 200 characters.
                Users previous personality: ${personality}
                `,
              },
            ],
          },
          ...messages,
        ],
      });

      const { response } = await chat.sendMessage(
        "describe my personality in 3rd person perspective dont use you use 'user' instead and in points rather than sentences"
      );
      const personalityProfile = await response.text();
      await AsyncStorage.setItem("personality", personalityProfile.trim());
      setPersonality(personalityProfile.trim());
    } catch (e) {
      console.error("Error in personalization:", e);
    }
  }

  async function getPersonality() {
    try {
      const p = await AsyncStorage.getItem("personality");
      if (p) setPersonality(p);
      else setPersonality("no personality found");
    } catch (e) {
      console.log("Error getting personality:", e.message);
    }
  }

  const randomCall = () => {
    const shouldCall = messages.length % 10;
    if (shouldCall === 0 && responses > 0) {
      personalization();
    }
  };

  // Updated streamAIResponse function
  const streamAIResponse = async (prompt) => {
    try {
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [
              {
                text: `You are Kiki, an AI assistant in the Quiplyy chat app created by Kichu(person). Your personality:
                *Charming, smart, whimsical, and uplifting
                *Loves making light-hearted jokes and dad jokes
                *Offers words of encouragement
                *Brightens users' days with smiles and fun vibes
                *Uses emojis frequently
                *Has a quirky opinion that pineapple on pizza is a crime (mention only if relevant)
                users name is: ${user.username}
                User's personality: ${personality}`,
              },
            ],
          },
          ...messages,
        ],
      });

      if (responses >= 40) {
        const aiMessage = {
          role: "model",
          parts: [{ text: "max limit reached 😓" }],
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
        setTimeout(() => {
          reset();
          setIsStreaming(false);
        }, 3000);
        return;
      }
      const { response } = await chat.sendMessage(prompt);
      const resMes = await response.text();
      const aiMessage = { role: "model", parts: [{ text: resMes.trim() }] };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
      setResponses((c) => c + 1);
      setIsStreaming(false);
      randomCall();
    } catch (e) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "model", parts: [{ text: `error occured 😞 ${e.message}` }] },
      ]);
      setTimeout(() => {
        reset();
        setIsStreaming(false);
      }, 5000);
    }
  };

  const handleSend = async () => {
    if (inputText.trim() === "" || isStreaming || !isConnected) return;
    const userMessage = { role: "user", parts: [{ text: inputText.trim() }] };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText("");
    setIsStreaming(true);
    await streamAIResponse(inputText.trim());
  };

  useEffect(() => {
    flatListRef.current.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    getPersonality();
  }, []);

  return (
    <SafeAreaView>
      <View style={styles.background}>
        <RotatingGradientRing />
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        >
          <Icon name="ChevronLeft" size={40} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
        style={styles.KeyboardAvoidingView}
      >
        <FlatList
          data={messages}
          renderItem={({ item }) => <RenderList item={item} />}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          ref={flatListRef}
          onContentSizeChange={() =>
            flatListRef.current.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
        />
        <View style={styles.footer}>
          <View style={styles.inputContainer(textInputColor)}>
            <BlurView
              intensity={90}
              tint={theme === "dark" ? "dark" : "light"}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 5,
              }}
            >
            <TextInput
              style={styles.input(theme, textInputColor)}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={
                theme === "dark"
                  ? "rgba(224,224,224,0.5)"
                  : "rgba(45,45,45,0.5)"
              }
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={styles.Button(theme, isConnected && !isStreaming, 40, 40)}
              onPress={handleSend}
              disabled={!isConnected || isStreaming}
            >
              <Icon name="SendHorizontal" size={30} />
            </TouchableOpacity>
            </BlurView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    height: 50,
    paddingHorizontal: 10,
  },
  backIcon: {
    width: 40,
    height: 40,
    alignSelf: "center",
  },
  chatContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  inputContainer: (c) => ({
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    width: "96.5%",
    height: 50,
    overflow: "hidden",
  }),
  input: (theme, c) => ({
    flex: 1,
    color: theme === "dark" ? "#E0E0E0" : "#2D2D2D",
    padding: 15,
    fontWeight: "400",
  }),
  footer: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 10,
  },
  Button: (
    theme,
    isC,
    height = 50,
    width = 50,
    marginLeft = 0,
    marginR = 0
  ) => ({
    height: height,
    width: width,
    backgroundColor:
      theme === "dark"
        ? `rgba(198,0,198,${isC ? 0.8 : 0.2})`
        : `rgba(0,255,0,${isC ? 0.8 : 0.2})`,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginLeft: marginLeft,
    marginRight: marginR,
  }),
  textStyles: (theme) => ({
    color: theme === "dark" ? "#E0E0E0" : "#2D2D2D",
    fontSize: 16,
    fontWeight: "400",
  }),
  KeyboardAvoidingView: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
});
