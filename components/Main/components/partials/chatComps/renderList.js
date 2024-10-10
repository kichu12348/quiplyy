import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import LongPressComponent from "../utils/longPress";
import { useTheme } from "../../../../../contexts/theme";
import { useAuth } from "../../../../../contexts/authContext";
import { Image } from "expo-image";

const RenderList = memo(
  ({
    item,
    isFocused,
    longPressEventHandle,
    onTapOnImage,
    stickers,
  }) => {
    function isOnlyEmojis(text) {
      const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
      const trimmedText = text.replace(/\s+/g, "");
      const emojiMatches = trimmedText.match(emojiRegex);
      return emojiMatches && emojiMatches.length === [...trimmedText].length;
    }


    const {theme}=useTheme();
    const {user}=useAuth();

    if (!item) return null;
    return (
      <View
        style={styles.flatListItem(
          item.sender === user?.id ? "flex-end" : "flex-start"
        )}
      >
        <LongPressComponent
          key={item?.id}
          onLongPress={(state) =>
            isFocused.focused ? null : longPressEventHandle(state, item)
          }
          time={500}
          onTap={(state) => {
            if (isFocused.focused) return;
            onTapOnImage(state, item);
          }}
        >
          <View
            style={
              item.sender === user?.id
                ? styles.messageLeft(
                    item.isSticker || item.isImage
                      ? true
                      : isOnlyEmojis(item.msg),
                    theme
                  )
                : styles.messageRight(
                    item.isSticker || item.isImage
                      ? true
                      : isOnlyEmojis(item.msg),
                    theme
                  )
            }
          >
            {item.isSticker && !item.isImage ? (
              <>
                {item.isGroup && item.sender !== user?.id ? (
                  <Text
                    style={styles.textStyles(
                      theme,
                      15,
                      "400",
                      theme === "dark" ? "white" : "black",
                      0.8
                    )}
                  >
                    {item.senderName}
                  </Text>
                ) : null}
                {item.isSticker && !item.isImage ? (
                  <Image
                    source={stickers[item.sticker]}
                    style={styles.Image(
                      item.sender === user?.id ? 0 : -10,
                      item.sender === user?.id ? -10 : 0,
                      200,
                      200,
                      10
                    )}
                  />
                ) : null}
              </>
            ) : !item.isImage && !item.isSticker ? (
              <>
                {item.isGroup && item.sender !== user?.id ? (
                  <Text style={styles.textStyles(theme, 12, "400", null, 0.8)}>
                    {item.senderName}
                  </Text>
                ) : null}
                <Text
                  style={styles.textStyles(
                    theme,
                    isOnlyEmojis(item.msg) ? 60 : 18,
                    "400",
                    null
                  )}
                >
                  {item.msg}
                </Text>
              </>
            ) : (
              <>
                {item.isGroup && item.sender !== user?.id ? (
                  <Text style={styles.textStyles(theme, 12, "400", null, 0.8)}>
                    {item.senderName}
                  </Text>
                ) : null}
                {item.isImage && (
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.Image(
                      item.sender === user?.id ? 0 : -10,
                      item.sender === user?.id ? -10 : 0,
                      200,
                      200,
                      10
                    )}
                  />
                )}
              </>
            )}
          </View>
        </LongPressComponent>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  flatListItem: (justifyContent = "flex-start") => ({
    padding: 0,
    backgroundColor: "transparent",
    margin: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: justifyContent,
  }),
  messageLeft: (isEmoji, theme) => ({
    backgroundColor: isEmoji
      ? "transparent"
      : theme === "dark"
      ? "rgba(0, 122, 255, 0.8)"
      : "rgba(0,255,0,0.8)", //theme==="dark"?"#388E3C":"#4CAF50"
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 5,
    minWidth: 50,
    maxWidth: "80%",
    marginRight: 10,
    flexDirection: "column",
  }),
  messageRight: (isEmoji, theme) => ({
    backgroundColor: isEmoji
      ? "transparent"
      : theme === "dark"
      ? "rgba(30,30,30,0.8)"
      : "rgba(224,224,224,0.8)", //theme==="dark"?"#388E3C":"#4CAF50"
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 5,
    minWidth: 50,
    maxWidth: "80%",
    marginLeft: 10,
    flexDirection: "column",
  }),
  textStyles: (
    theme,
    fontSize = 20,
    fontWeight = "bold",
    color = theme === "dark" ? "#E0E0E0" : "#2D2D2D",
    opacity = 1
  ) => ({
    color: color !== null ? color : theme === "dark" ? "#E0E0E0" : "#2D2D2D",
    fontSize: fontSize,
    fontWeight: fontWeight,
    opacity: opacity,
  }),
  Image: (
    marginLeft = 0,
    marginR = 0,
    height = 40,
    width = 40,
    borderRadius = 0,
    alignSelf = "center"
  ) => ({
    height: height,
    width: width,
    marginLeft: marginLeft,
    marginRight: marginR,
    borderRadius: borderRadius === 0 ? height / 2 : borderRadius,
    alignSelf: alignSelf,
  }),
});

export default RenderList;
