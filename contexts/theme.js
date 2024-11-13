import { useState, useContext, createContext, useMemo, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

//import icons
import logoL from "./images/logoL.png";
import logoD from "./images/logoD.png";

//import stickers
import mogCat from "./stickers/mogCat.gif";
import bonjour from "./stickers/bonjour.jpeg";
import fisiks from "./stickers/fisiks.jpeg";
import ionGetIt from "./stickers/ionGetIt.jpeg";
import mexicanCat from "./stickers/mexicanCat.gif";
import stopThinking from "./stickers/stopThinking.jpeg";
import think from "./stickers/think.jpeg";
import tricks from "./stickers/tricks.jpeg";
import vanish from "./stickers/vanish.gif";
import smileCat from "./stickers/smileCat.gif";
import sus from "./stickers/sus.png";
import okCat from "./stickers/okCat.png";
import dogIntense from "./stickers/dogIntense.gif";
import dancingDoge from "./stickers/dancingDoge.gif";
import dancingDog from "./stickers/dancingDog.gif";
import susAmg from "./stickers/susAmg.png";

const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark");
  const [BackGroundForChat, setBackGroundForChat] = useState("Cheese");

  const [background, setBackground] = useState("#121212");
  const [textInputColor, setTextInputColor] = useState({
    border: "#616161",
    color: "rgba(0,0,0,0.5)",
  });
  const [chatMsgColor, setChatMsgColor] = useState({
    senderMsgColor: "#4CAF50",
    receiverMsgColor: "#1E1E1E",
  });
  const [chatColor, setChatColor] = useState({
    sender: "rgba(0, 122, 255, 1)",
    receiver: "rgba(0,255,0,0.8)",
  });

  //stickers
  const stickers = {
    mogCat,
    bonjour,
    fisiks,
    ionGetIt,
    mexicanCat,
    stopThinking,
    think,
    tricks,
    vanish,
    smileCat,
    sus,
    okCat,
    dogIntense,
    dancingDoge,
    dancingDog,
    susAmg,
  };
  const stickerList = [
    { id: 1, name: "mogCat" },
    { id: 2, name: "bonjour" },
    { id: 3, name: "fisiks" },
    { id: 4, name: "ionGetIt" },
    { id: 5, name: "mexicanCat" },
    { id: 6, name: "stopThinking" },
    { id: 7, name: "think" },
    { id: 8, name: "tricks" },
    { id: 9, name: "vanish" },
    { id: 10, name: "smileCat" },
    { id: 11, name: "sus" },
    { id: 12, name: "okCat" },
    { id: 13, name: "dogIntense" },
    { id: 14, name: "dancingDoge" },
    { id: 15, name: "dancingDog" },
    { id: 16, name: "susAmg" },
  ];

  /////////////////////////////////////////////

  const darkIcons = {
    logo: logoD,
  };

  const lightIcons = {
    logo: logoL,
  };

  const [Icons, setIcons] = useState(darkIcons);

  const chatBackgroundModel = async (item) => {
    try {
      await AsyncStorage.setItem("BackGroundForChat", item);
      setBackGroundForChat(item);
    } catch (e) {
      return;
    }
  };

  const themeSetting = async (theme) => {
    try {
      await AsyncStorage.setItem("theme", theme);
      setTheme(theme);
      if (theme === "light") {
        setIcons(lightIcons);
        setBackground("#F7F7F7");
        setTextInputColor({
          border: "#B0BEC5",
          color: "rgba(255,255,255,0.8)",
        });
      } else {
        setIcons(darkIcons);
        setBackground("#121212");
        setTextInputColor({
          border: "#616161",
          color: "rgba(0,0,0,0.5)",
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    const getTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("theme");
        const chatColor = await AsyncStorage.getItem("chatColor");
        const BackGroundForChat = await AsyncStorage.getItem(
          "BackGroundForChat"
        );
        if (BackGroundForChat) {
          setBackGroundForChat(BackGroundForChat);
        }
        if (storedTheme) {
          setTheme(storedTheme);
          if (storedTheme === "dark") {
            setIcons(darkIcons);
          } else {
            setIcons(lightIcons);
          }
          if (chatColor) {
            setChatColor(JSON.parse(chatColor));
          }
        }
      } catch (e) {
        console.log(e);
      }
    };
    getTheme();

    if (theme === "light") {
      setIcons(lightIcons);
    } else {
      setIcons(darkIcons);
    }
  }, []);

  const changeChatColor = async (sender, receiver) => {
    try {
      await AsyncStorage.setItem(
        "chatColor",
        JSON.stringify({ sender, receiver })
      );
      setChatColor({ sender, receiver });
    } catch (e) {
      console.log(e);
    }
  };

  const value = useMemo(() => {
    return {
      theme,
      themeSetting,
      Icons,
      changeChatColor,
      chatColor,
      background,
      textInputColor,
      chatMsgColor,
      setChatMsgColor,
      chatBackgroundModel,
      BackGroundForChat,
      lightIcons,
      darkIcons,
      stickerList,
      stickers,
    };
  }, [
    theme,
    Icons,
    chatColor,
    background,
    textInputColor,
    chatMsgColor,
    BackGroundForChat,
  ]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  return context;
};

export { ThemeProvider, useTheme };
