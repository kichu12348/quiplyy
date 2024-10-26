import { memo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import LongPressComponent from "../utils/longPress";
import { useTheme } from "../../../../../contexts/theme";
import { useAuth } from "../../../../../contexts/authContext";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
  useSharedValue,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Const
const CONSTANTS = {
  EMOJI_REGEX: /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu,
  LONG_MESSAGE_THRESHOLD: 40,
  LONG_PRESS_DELAY: 500,
  MAX_WIDTH_PERCENTAGE: "80%",
  DEFAULT_IMAGE_DIMENSIONS: 200,
  DEFAULT_BORDER_RADIUS: 10,
  HALLOWEEN_KEYWORDS: [
    "halloween",
    "trick or treat",
    "spooky",
    "ghost",
    "witch",
    "pumpkin",
  ],
  HALLOWEEN_COLOR: "rgba(255, 140, 0, 0.9)",
  BAT_COUNT: 15,
  ANIMATION_DURATION: 2000,
};

const BatAnimation = ({ isVisible, onAnimationComplete }) => {
  const bats = Array(CONSTANTS.BAT_COUNT)
    .fill(0)
    .map((_, index) => {
      const x = useSharedValue(SCREEN_WIDTH / 2);
      const y = useSharedValue(SCREEN_HEIGHT);
      const rotate = useSharedValue(0);
      const scale = useSharedValue(1);

      const animatedStyle = useAnimatedStyle(() => ({
        transform: [
          { translateX: x.value },
          { translateY: y.value },
          { rotate: `${rotate.value}deg` },
          { scale: scale.value },
        ],
        position: "absolute",
      }));

      const animate = () => {
        const startX = Math.random() * SCREEN_WIDTH;
        x.value = startX;
        y.value = SCREEN_HEIGHT;
        const targetX = startX + (Math.random() * 300 - 150);

        x.value = withSequence(
          withDelay(
            index * 100,
            withTiming(targetX, {
              duration: CONSTANTS.ANIMATION_DURATION,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            })
          )
        );

        y.value = withSequence(
          withDelay(
            index * 100,
            withTiming(
              -SCREEN_HEIGHT,
              {
                duration: CONSTANTS.ANIMATION_DURATION,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              },
              (finished) => {
                if (finished && index === CONSTANTS.BAT_COUNT - 1) {
                  runOnJS(onAnimationComplete)();
                }
              }
            )
          )
        );

        // Rotate animation
        rotate.value = withSequence(
          withTiming(-30, { duration: 500 }),
          withTiming(30, { duration: 1000 }),
          withTiming(-30, { duration: 500 })
        );

        // Scale animation
        scale.value = withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(0.8, { duration: 500 }),
          withTiming(1, { duration: 500 })
        );
      };

      if (isVisible) {
        animate();
      }

      return (
        <Animated.View key={index} style={animatedStyle}>
          <Image
            source={require("./images/bat.png")}
            style={styles.batImage}
            contentFit="contain"
          />
        </Animated.View>
      );
    });

  return isVisible ? (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {bats}
    </View>
  ) : null;
};

// Message Content Component
const MessageContent = memo(
  ({
    item,
    theme,
    isEmoji,
    stickers,
    user,
    isHalloweenMessage,
    onJackOLanternPress,
    background,
  }) => {
    const {
      isSticker,
      isImage,
      isGroup,
      sender,
      senderName,
      msg,
      imageUri,
      sticker,
    } = item;
    const isSender = sender === user?.id;

    // Add a small bounce animation for Halloween messages
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const renderSenderName = () => {
      if (isGroup && sender !== user?.id) {
        return <Text style={styles.senderName(theme)}>{senderName}</Text>;
      }
      return null;
    };

    const renderJackOLantern = () => {
      if (isHalloweenMessage) {
        return (
          <Animated.View style={[styles.jackOLantern(isSender)]}>
            <LongPressComponent
              onTap={() => {
                scale.value = withSequence(
                  withTiming(1.1, { duration: 100 }),
                  withTiming(1, { duration: 100 })
                );
                onJackOLanternPress();
              }}
            >
              <Image
                source={require("./images/jack-o-lantern.png")}
                style={styles.jackOLanternImage}
                contentFit="contain"
              />
            </LongPressComponent>
          </Animated.View>
        );
      }
      return null;
    };

    const content = (
      <>
        {renderSenderName()}
        {renderJackOLantern()}
        {isSticker && !isImage ? (
          <Image
            source={stickers[sticker]}
            style={styles.image(sender === user?.id)}
            contentFit="contain"
          />
        ) : isImage ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image(sender === user?.id)}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.messageText(theme, isEmoji, isHalloweenMessage,background)}>
            {msg}
          </Text>
        )}
      </>
    );

    return isHalloweenMessage ? (
      <Animated.View style={animatedStyle}>{content}</Animated.View>
    ) : (
      content
    );
  }
);

const RenderList = memo(
  ({
    item,
    isFocused,
    longPressEventHandle,
    onTapOnImage,
    stickers,
    background = null,
  }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [showBats, setShowBats] = useState(false);

    if (!item) return null;

    const isEmoji = (text) => {
      const trimmedText = text.replace(/\s+/g, "");
      const emojiMatches = trimmedText.match(CONSTANTS.EMOJI_REGEX);
      return emojiMatches && emojiMatches.length === [...trimmedText].length;
    };

    const isHalloweenMessage = useCallback((msg) => {
      if (!msg || msg.length > CONSTANTS.LONG_MESSAGE_THRESHOLD) return false;
      const lowercaseMsg = msg.toLowerCase();
      return CONSTANTS.HALLOWEEN_KEYWORDS.some((keyword) =>
        lowercaseMsg.includes(keyword)
      );
    }, []);

    const handleJackOLanternPress = useCallback(() => {
      setShowBats(true);
    }, []);

    const handleAnimationComplete = useCallback(() => {
      setShowBats(false);
    }, []);

    const isSender = item.sender === user?.id;
    const messageIsEmoji = isEmoji(item.msg);
    const isLongMessage = item.msg.length > CONSTANTS.LONG_MESSAGE_THRESHOLD;
    const isHalloween = isHalloweenMessage(item.msg);

    return (
      <>
        <View style={styles.container(isSender)}>
          <LongPressComponent
            key={item?.id}
            onLongPress={(state) =>
              !isFocused.focused && longPressEventHandle(state, item)
            }
            time={CONSTANTS.LONG_PRESS_DELAY}
            onTap={(state) => {
              if (isHalloween) {
                handleJackOLanternPress();
                return;
              }
              if (!isFocused.focused) {
                onTapOnImage(state, item);
              }
            }}
          >
            <View
              style={styles.messageContainer({
                isSender,
                isEmoji: messageIsEmoji || item.isSticker || item.isImage,
                isLongMessage,
                theme,
                background,
                isHalloween,
              })}
            >
              <MessageContent
                item={item}
                theme={theme}
                isEmoji={messageIsEmoji}
                stickers={stickers}
                user={user}
                isHalloweenMessage={isHalloween}
                onJackOLanternPress={handleJackOLanternPress}
                background={background}
              />
            </View>
          </LongPressComponent>
        </View>
        <BatAnimation
          isVisible={showBats}
          onAnimationComplete={handleAnimationComplete}
        />
      </>
    );
  }
);

const styles = StyleSheet.create({
  container: (isSender) => ({
    padding: 0,
    backgroundColor: "transparent",
    margin: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: isSender ? "flex-end" : "flex-start",
  }),
  messageContainer: ({
    isSender,
    isEmoji,
    isLongMessage,
    theme,
    background,
    isHalloween,
  }) => ({
    backgroundColor: isEmoji
      ? "transparent"
      : isHalloween
      ? CONSTANTS.HALLOWEEN_COLOR
      : background
      ? isSender
        ? background.sender
        : background.reciver
      : theme === "dark"
      ? isSender
        ? "rgba(0, 122, 255, 0.8)"
        : "rgba(30,30,30,0.8)"
      : isSender
      ? "rgba(0,255,0,0.8)"
      : "rgba(224,224,224,0.8)",
    borderRadius: isLongMessage ? 15 : 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 2,
    minWidth: 50,
    maxWidth: CONSTANTS.MAX_WIDTH_PERCENTAGE,
    marginHorizontal: 10,
    flexDirection: "column",
    position: "relative",
    shadowColor: isHalloween ? "#000" : "transparent",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isHalloween ? 0.25 : 0,
    shadowRadius: 4,
    elevation: isHalloween ? 5 : 0,
  }),
  messageText: (theme, isEmoji, isHalloween, background) => ({
    color: isHalloween
      ? "#2D2D2D"
      : background
      ? "#E0E0E0"
      : theme === "dark"
      ? "#E0E0E0"
      : "#2D2D2D",
    fontSize: isEmoji ? 60 : 18,
    fontWeight: isHalloween ? "bold" : "400",
  }),
  senderName: (theme) => ({
    color: theme === "dark" ? "#E0E0E0" : "#2D2D2D",
    fontSize: 12,
    fontWeight: "400",
    opacity: 0.8,
  }),
  image: (isSender) => ({
    height: CONSTANTS.DEFAULT_IMAGE_DIMENSIONS,
    width: CONSTANTS.DEFAULT_IMAGE_DIMENSIONS,
    marginLeft: isSender ? 0 : -10,
    marginRight: isSender ? -10 : 0,
    borderRadius: CONSTANTS.DEFAULT_BORDER_RADIUS,
    alignSelf: "center",
  }),
  jackOLantern: (isSender) => ({
    position: "absolute",
    top: -20,
    [isSender ? "left" : "right"]: -25,
    zIndex: 1,
  }),
  jackOLanternImage: {
    width: 30,
    height: 30,
  },
  batImage: {
    width: 80,
    height: 80,
  },
});

export default RenderList;
