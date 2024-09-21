import React from "react";
import { Modal, Pressable, StyleSheet, Image,View} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../../../../contexts/theme";
import { StatusBar } from "expo-status-bar";

const CustomModal = ({ visible, onRequestClose, ImageUri, time=20000 }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const {background}=useTheme();

  React.useEffect(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    }, [visible]);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        onRequestClose();
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }, time);
      return () => clearTimeout(timer);
    }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const onGestureEvent = (event) => {
    translateX.value = event.nativeEvent.translationX;
    translateY.value = event.nativeEvent.translationY;
  };

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === 5) {
      if (
        Math.abs(translateY.value) > 100 ||
        Math.abs(translateX.value) > 100
      ) {
        onRequestClose();
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={() => {
        onRequestClose();
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }}
      animationType="fade"
      hardwareAccelerated={true}
    >
      <StatusBar hidden  backgroundColor="black" />
      <Pressable
        style={styles.overlay}
        onPress={() => {
          onRequestClose();
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
        }}
      >
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View style={[styles.modalContainer, animatedStyle]}>
            <View style={styles.bg(background)}>
            <Image 
            source={{ uri: ImageUri }} 
            style={styles.Image} 
            resizeMode="cover"
            />
            </View>
          </Animated.View>
        </PanGestureHandler>
      </Pressable>
    </Modal>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  modalContainer: {
    width: "100%",
    height: "100%",
  },
  Image: {
    width: "100%",
    height: "100%",
  },
  bg: (background) => ({
    backgroundColor: background,
    overflow: "hidden",
    height: "100%",
    width: "100%",
  }),
});
