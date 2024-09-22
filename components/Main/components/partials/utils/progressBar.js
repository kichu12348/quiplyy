import React, { useEffect, useState } from "react";
import { View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PROGRESS_BAR_WIDTH = SCREEN_WIDTH * 0.8; // 80% of screen width
const THUMB_WIDTH = 15;

const ProgressBar = ({ theme, playbackStatus, sound, isPlaying }) => {
  const [barWidth, setBarWidth] = useState(PROGRESS_BAR_WIDTH);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (playbackStatus) {
      progress.value =
        (playbackStatus.positionMillis / playbackStatus.durationMillis) *
        barWidth;
    }
  }, [playbackStatus, barWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: progress.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.min(progress.value, barWidth - THUMB_WIDTH) },
    ],
  }));

  const updateSound = (newPosition) => {
    try {
      if (sound && playbackStatus && !playbackStatus.didJustFinish) {
        const newPositionMillis =
          (newPosition / barWidth) * playbackStatus.durationMillis;
        sound.setPositionAsync(Math.floor(newPositionMillis));
        if (isPlaying) {
          sound.playAsync();
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      const newProgress = Math.max(
        0,
        Math.min(e.absoluteX - THUMB_WIDTH / 2, barWidth - THUMB_WIDTH)
      );
      progress.value = newProgress;
    })
    .onEnd(() => {
      runOnJS(updateSound)(progress.value);
    });

  useAnimatedReaction(
    () => progress.value,
    (currentProgress) => {
      if (
        playbackStatus &&
        !playbackStatus.isPlaying &&
        !playbackStatus.didJustFinish
        &&sound
      ) {
        runOnJS(updateSound)(currentProgress);
      }
    },
    [playbackStatus]
  );

  return (
    <View
      style={styles.progressBarContainer}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setBarWidth(width);
      }}
    >
      <View style={styles.progressBar(theme)}>
        <Animated.View style={[styles.progressFill(theme), progressStyle]} />
      </View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.thumb(theme), thumbStyle]} />
      </GestureDetector>
    </View>
  );
};

const styles = {
  progressBarContainer: {
    width: "100%",
    height: 20,
    justifyContent: "center",
  },
  progressBar: (theme) => ({
    height: 5,
    backgroundColor:
      theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
    borderRadius: 2.5,
  }),
  progressFill: (theme) => ({
    height: "100%",
    backgroundColor: theme === "dark" ? "white" : "black",
    borderRadius: 2.5,
  }),
  thumb: (theme) => ({
    position: "absolute",
    width: THUMB_WIDTH,
    height: THUMB_WIDTH,
    borderRadius: THUMB_WIDTH / 2,
    backgroundColor: theme === "dark" ? "white" : "black",
  }),
};

export default ProgressBar;
