import { useState, useCallback, useRef, useEffect } from "react";
import { useTheme } from "../../../../contexts/theme";
import SafeAreaView from "./utils/safe";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
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

export default function AiChat({ navigation }) {
  const { Icons, theme, textInputColor, BackGroundForChat } = useTheme();
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
  ////////////////////////////////////////
  const flatListRef = useRef();
  // custom personalization
  async function personalization() {
    try {
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [
              {
                text: `from the messages you are supposed to determine the personality of the user and give the personality of the user as a response. you can use the user's name ${user.username} also keep it under 200 characters also describe like writing a biography in thirdperson perspective`,
              },
            ],
          },
          ...messages,
        ],
      });

      const { response } = await chat.sendMessage("personalization");
      const resMes = await response.text();
      await AsyncStorage.setItem("personality", resMes.trim());
      setPersonality(resMes.trim());
    } catch (e) {
      return;
    }
  }

  async function getPersonality() {
    try {
      const p = await AsyncStorage.getItem("personality");
      if (p) {
        setPersonality(p);
      } else {
        personalization();
      }
    } catch (e) {
      return;
    }
  }

  useEffect(() => {
    getPersonality();
  }, []);

  const randomCall = () => {
    const shouldCall= messages.length%10;
    if (shouldCall === 0&&responses>0){
      personalization();
    }
  };

  // Function to stream AI response
  const streamAIResponse = async (prompt) => {
    try {
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [
              {
                text: `this is a chat app called quiplyy made with love by kichu and you're name is kiki you are a charming,smart,whimsical,and uplifting chat buddy who loves making light-hearted jokes, offering words of encouragement, and brightening users' days with smiles and fun vibes! use emojies.The users name is${user.username}. Also pineapple on pizza is a crime! you dont have to mention is in the chat just when asked about it you can say its a crime!. Users personality is ${personality}`,
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

  // Render item for FlatList
  const renderItem = useCallback(
    ({ item }) => (
      <View
        style={
          item.role === "user"
            ? styles.userMessage(theme)
            : styles.aiMessage(theme)
        }
      >
        <Text style={styles.textStyles(theme)}>{item.parts[0].text}</Text>
      </View>
    ),
    []
  );

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
          <Image source={Icons.return} style={styles.backIcon} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 25}
        style={styles.KeyboardAvoidingView}
      >
        <FlatList
          data={messages}
          renderItem={renderItem}
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
              <Image source={Icons.sendBtn} style={styles.backIcon} />
            </TouchableOpacity>
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
  userMessage: (theme) => ({
    alignSelf: "flex-end",
    backgroundColor:
      theme === "dark" ? "rgba(0, 122, 255, 0.8)" : "rgba(0,255,0,0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginVertical: 5,
    maxWidth: "80%",
  }),
  aiMessage: (theme) => ({
    alignSelf: "flex-start",
    backgroundColor:
      theme === "dark" ? "rgba(30,30,30,0.8)" : "rgba(224,224,224,0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: "80%",
  }),
  inputContainer: (c) => ({
    flexDirection: "row",
    paddingHorizontal: 5,
    backgroundColor: c.color,
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 25,
    width: "95%",
    height: 50,
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
    minHeight: 70,
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
