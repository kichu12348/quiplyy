import { useState, useContext, createContext, useMemo, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import chatImg from './images/chatImg.jpg';
import chatL from './images/chatL.png';
import chatD from './images/chatD.png';
import settingL from './images/settingL.png';
import settingD from './images/settingD.png';
import stuffL from './images/stuffL.png';
import stuffD from './images/stuffD.png';
import returnL from './images/returnL.png';
import returnD from './images/returnD.png';
import sendBtnD from './images/sendBtnD.png';
import stickerD from './images/stickerD.png';
import blogD from './images/blogD.png';
import blogL from './images/blogL.png';
import addL from './images/addL.png';
import addD from './images/addD.png';

const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark");
  const [wallPaper, setWallPaper] = useState(chatImg);
  const[chatColor,setChatColor]=useState({
    sender:'rgba(0, 122, 255, 1)',
    receiver:'rgba(0,255,0,0.8)'
  });
  const [Icons, setIcons] = useState({
    chat: chatD,
    setting: settingD,
    stuff: stuffD,
    return: returnD,
    sendBtn: sendBtnD,
    sticker: stickerD,
    blog: blogD,
    add:addD
  });
  
  const themeSetting = async (theme) => {
    try {
      await AsyncStorage.setItem('theme', theme);
      setTheme(theme);
      if (theme === "light") {
        setIcons({
          chat: chatL,
          setting: settingL,
          stuff: stuffL,
          return: returnL,
          sendBtn: sendBtnD,
          sticker: stickerD,
          blog: blogL,
          add:addL
        });
      } else {
        setIcons({
          chat: chatD,
          setting: settingD,
          stuff: stuffD,
          return: returnD,
          sendBtn: sendBtnD,
          sticker: stickerD,
          blog: blogD,
          add:addD
        });
      }
    } catch (e) {
      console.log(e);
    }
  
  }

  useEffect(() => {
    const getTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        const chatColor = await AsyncStorage.getItem('chatColor');
        if (storedTheme) {
          setTheme(storedTheme);
          if(storedTheme==="dark"){
            setIcons({
              chat: chatD,
              setting: settingD,
              stuff: stuffD,
              return: returnD,
              sendBtn: sendBtnD,
              sticker: stickerD,
              blog: blogD,
              add:addD
            });
          }else{
            setIcons({
              chat: chatL,
              setting: settingL,
              stuff: stuffL,
              return: returnL,
              sendBtn: sendBtnD,
              sticker: stickerD,
              blog: blogL,
              add:addL
            });
          }
          if(chatColor){
            setChatColor(JSON.parse(chatColor));
          }
        }
        const storedWallPaper = await AsyncStorage.getItem('wallPaper');
        if (storedWallPaper) {
          setWallPaper(storedWallPaper);
        }
      } catch (e) {
        console.log(e);
      }
    };

    getTheme();

    if (theme === "light") {
      setIcons({
        chat: chatL,
        setting: settingL,
        stuff: stuffL,
        return: returnL,
        sendBtn: sendBtnD,
        sticker: stickerD,
        blog: blogL,
        add:addL
      });
    } else {
      setIcons({
        chat: chatD,
        setting: settingD,
        stuff: stuffD,
        return: returnD,
        sendBtn: sendBtnD,
        sticker: stickerD,
        blog: blogD,
        add:addD
      });
    }
  }, []);

  const changeChatColor = async (sender,receiver) => {
    try {
      await AsyncStorage.setItem('chatColor', JSON.stringify({sender,receiver}));
      setChatColor({sender,receiver});
    } catch (e) {
      console.log(e);
    }
  }

  const value = useMemo(() => {
    return { theme, themeSetting, wallPaper, setWallPaper, Icons,changeChatColor,chatColor};
  }, [theme, wallPaper, Icons,chatColor]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  return context;
};

export { ThemeProvider, useTheme };
