import { useContext, createContext, useMemo, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PineappleBanContext = createContext();

export const usePineappleBan = () => {
  return useContext(PineappleBanContext);
};

//constants
const PINEAPPLE_BAN_TIME = 1000 * 60 * 5; //5 minutes
const MAX_PINEAPPLE_COUNT = 10;

export const PineappleBanProvider = ({ children }) => {
  const [isPineappleBanned, setIsPineappleBanned] = useState(false);

  const checkIfBanned = async () => {
    try {
      const banTime = await AsyncStorage.getItem("pineappleBanTime");
      if (banTime) {
        const banTimeInt = parseInt(banTime);
        const checkIfBanned = Date.now() - banTimeInt;
        if (checkIfBanned < PINEAPPLE_BAN_TIME) {
          setIsPineappleBanned(true);
          return;
        }
        checkIfUnBanned();
      }
    } catch (e) {
      console.log(e);
    }
  };

  const setBanTime = async () => {
    const hasReachedLimit = await checkIfLimitReached();
    if (!hasReachedLimit) return;
    try {
      await AsyncStorage.setItem("pineappleBanTime", Date.now().toString());
      setIsPineappleBanned(true);
      checkIfUnBanned();
    } catch (e) {
      console.log(e);
    }
  };

  const unBan = async () => {
    try {
      await AsyncStorage.removeItem("pineappleBanTime");
      await AsyncStorage.removeItem("pineappleCount");
      setIsPineappleBanned(false);
    } catch (e) {
      console.log(e);
    }
  };

  const checkIfTextHasPineapple = (text) => {
    const textArray = text.toLowerCase().split(" ");
    if (textArray.includes("pineapple")) {
      return true;
    }
    return false;
  };

  const checkIfLimitReached = async () => {
    try {
      const pineappleCount = await AsyncStorage.getItem("pineappleCount");
      if (pineappleCount) {
        const pineappleCountInt = parseInt(pineappleCount);
        if (pineappleCountInt >= MAX_PINEAPPLE_COUNT) {
          await AsyncStorage.removeItem("pineappleCount");
          return true;
        }
        await AsyncStorage.setItem(
          "pineappleCount",
          (pineappleCountInt + 1).toString()
        );
        return false;
      }
      await AsyncStorage.setItem("pineappleCount", "1");
      return false;
    } catch (e) {
      console.log(e);
    }
  };

  async function checkIfUnBanned() {
    if (!isPineappleBanned) return;
    const banTime = await AsyncStorage.getItem("pineappleBanTime");
    if (banTime) {
      const banTimeInt = parseInt(banTime);
      const checkIfBanned = Date.now() - banTimeInt;
      if (checkIfBanned >= PINEAPPLE_BAN_TIME) {
        await unBan();
        return;
      }
    }
    setTimeout(checkIfUnBanned, 1000);
  }

  useEffect(() => {
    checkIfBanned();
  }, []);

  const value = useMemo(
    () => ({
      isPineappleBanned,
      setBanTime,
      unBan,
      checkIfTextHasPineapple,
    }),
    [isPineappleBanned]
  );

  return (
    <PineappleBanContext.Provider value={value}>
      {children}
    </PineappleBanContext.Provider>
  );
};
