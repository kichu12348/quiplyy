import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import RenderList from "./renderList";
import { BlurView } from "expo-blur";
import { useTheme } from "../../../../../contexts/theme";
import { useAuth } from "../../../../../contexts/authContext";

const BlurItem = ({
  isFocused,
  setIsFocused,
  longPressEventHandle,
  onTapOnImage,
  stickers,
  deleteMessage,
  deleteMessageForMe,
}) => {
    const {theme}=useTheme();
    const {user}=useAuth();
  return (
    <>
      {isFocused.item && (
        <TouchableWithoutFeedback
          onPress={() => setIsFocused({ focused: false, item: isFocused.item })}
        >
          <BlurView
            intensity={300}
            tint={theme === "light" ? "light" : "dark"}
            style={styles.blurView(
              isFocused.item?.isSticker ? "center" : "flex-end"
            )}
          >
            <View style={styles.blurContainer}>
              <RenderList
                item={isFocused.item}
                isFocused={isFocused}
                longPressEventHandle={longPressEventHandle}
                onTapOnImage={onTapOnImage}
                stickers={stickers}
              />
              {isFocused.item.sender === user?.id && (
                <View style={styles.blurList(theme)}>
                  <TouchableOpacity
                    style={styles.blurTextContainer}
                    onPress={() => {
                      deleteMessage(isFocused.item.id, isFocused.item);
                    }}
                  >
                    <Text style={styles.blurText("rgba(255,0,0,0.8)")}>
                      delete for everyone
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.blurList(theme)}>
                <TouchableOpacity
                  style={styles.blurTextContainer}
                  onPress={() => {
                    deleteMessageForMe(isFocused.item.id);
                  }}
                >
                  <Text style={styles.blurText("rgba(255,255,255,0.8)")}>
                    delete for me
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </TouchableWithoutFeedback>
      )}
    </>
  );
};

export default BlurItem;

const styles = StyleSheet.create({
  blurView: (justifyContent = "center") => ({
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: justifyContent === "center" ? 0 : 20,
  }),
  blurContainer: {
    height: 200,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "transparent",
  },
  blurList: () => ({
    marginTop: 10,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    height: 50,
    minWidth: 200,
    padding: 10,
    borderRadius: 20,
  }),
  blurText: (color = "white") => ({
    fontSize: 25,
    fontWeight: "bold",
    color: color,
  }),
  blurTextContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
