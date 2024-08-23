import { useState, useContext, createContext, useMemo, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import chatImg from "./images/chatImg.jpg";
import chatL from "./images/chatL.png";
import chatD from "./images/chatD.png";
import settingL from "./images/settingL.png";
import settingD from "./images/settingD.png";
import stuffL from "./images/stuffL.png";
import stuffD from "./images/stuffD.png";
import returnL from "./images/returnL.png";
import returnD from "./images/returnD.png";
import sendBtnD from "./images/sendBtnD.png";
import stickerD from "./images/stickerD.png";
import blogD from "./images/blogD.png";
import blogL from "./images/blogL.png";
import addL from "./images/addL.png";
import addD from "./images/addD.png";
import tickL from "./images/tickL.png";
import tickD from "./images/tickD.png";
import groupL from "./images/groupL.png";
import groupD from "./images/groupD.png";
import chessD from "./images/chessD.png";
import chessL from "./images/chessL.png";
import chat1 from "./chatImgs/chat2.jpg";
import chat2 from "./chatImgs/readingIMG.jpg";
import chat5 from "./chatImgs/chat5.jpg";

const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark");
  const [wallPaper, setWallPaper] = useState({
    uri: chatImg,
    name: "chatImg",
  });
  const [background, setBackground] = useState("#121212");
  const [textInputColor, setTextInputColor] = useState({
    border: "#616161",
    color: "rgba(30,30,30,0.8)",
  });
  const [chatMsgColor, setChatMsgColor] = useState({
    senderMsgColor: "#4CAF50",
    receiverMsgColor: "#1E1E1E",
  });
  const [currentChatTheme, setCurrentChatTheme] = useState({
    image: chat1,
    statusBarColor: "rgba(0,0,0,0.8)",
    senderMsgColor: "#4CAF50",
    receiverMsgColor: "#1E1E1E",
  });
  const [chatColor, setChatColor] = useState({
    sender: "rgba(0, 122, 255, 1)",
    receiver: "rgba(0,255,0,0.8)",
  });
  const [Icons, setIcons] = useState({
    chat: chatD,
    setting: settingD,
    stuff: stuffD,
    return: returnD,
    sendBtn: sendBtnD,
    sticker: stickerD,
    blog: blogD,
    add: addD,
    tick: tickD,
    group: groupD,
    chess: chessD,
  });

  const darkIcons = {
    chat: chatD,
    setting: settingD,
    stuff: stuffD,
    return: returnD,
    sendBtn: sendBtnD,
    sticker: stickerD,
    blog: blogD,
    add: addD,
    tick: tickD,
    group: groupD,
    chess: chessD,
  };

  const lightIcons = {
    chat: chatL,
    setting: settingL,
    stuff: stuffL,
    return: returnL,
    sendBtn: sendBtnD,
    sticker: stickerD,
    blog: blogL,
    add: addL,
    tick: tickL,
    group: groupL,
    chess: chessL,
  };

  const chatTheme = [
    {
      image: chat2,
      statusBarColor: "#20097d",
    },
    {
      image: chat1,
      statusBarColor: "#090913",
    },
    {
      image: chat5,
      statusBarColor: "#0c171b",
    },
  ];
  //#0c171b

  const setCurrentChatImage = async (theme) => {
    try {
      await AsyncStorage.setItem("currentChatTheme", JSON.stringify(theme));
      setCurrentChatTheme(theme);
    } catch (e) {
      console.log(e);
    }
  };

  const getCurrentChatTheme = async () => {
    try {
      const storedCurrentChatTheme = await AsyncStorage.getItem(
        "currentChatTheme"
      );
      if (storedCurrentChatTheme) {
        setCurrentChatTheme(JSON.parse(storedCurrentChatTheme));
      } else {
        await AsyncStorage.setItem(
          "currentChatTheme",
          JSON.stringify(chatTheme[0])
        );
      }
    } catch (e) {
      setCurrentChatTheme(chatTheme[0]);
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
          color: "rgba(30,30,30,0.8)",
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
        const storedWallPaper = await AsyncStorage.getItem("wallPaper");
        if (storedWallPaper) {
          setWallPaper(storedWallPaper);
        }
      } catch (e) {
        console.log(e);
      }
    };
    getCurrentChatTheme();
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
      wallPaper,
      setWallPaper,
      Icons,
      changeChatColor,
      chatColor,
      background,
      textInputColor,
      chatMsgColor,
      setChatMsgColor,
      currentChatTheme,
      chatTheme,
      setCurrentChatImage,
    };
  }, [
    theme,
    wallPaper,
    Icons,
    chatColor,
    background,
    textInputColor,
    chatMsgColor,
    currentChatTheme,
    chatTheme
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
