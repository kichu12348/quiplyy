import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const SoundBars = ({ volumes}) => {
  // Create shared values for each volume level
  const animatedHeights = volumes.map(() => useSharedValue(0));

  useEffect(() => {
    const updateBars = () => {
      volumes.forEach((volume, index) => {
        // Update the height of each bar based on the volume level
        animatedHeights[index].value = withTiming(volume * 200, {
          duration: 500,
          easing: Easing.ease,
        });
      });
    };


    updateBars();

    const intervalId = setInterval(updateBars, 200); // Adjust the interval as needed

    return () => clearInterval(intervalId);
  }, [volumes]);

  return (
    <View style={styles.center}>
    <View style={styles.container}>
      {animatedHeights.map((height, index) => {
        const animatedStyle = useAnimatedStyle(() => ({
          height: height.value,
        }));

        return <Animated.View key={index} style={[styles.bar, animatedStyle]} />;
      })}
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "80%",
    height: 100,
  },
  bar: {
    width: 10,
    backgroundColor: "#FF5733", 
    borderRadius: 5,
  },
  center:{
    alignItems: "center",
    justifyContent: "center",
    flex:1,
    height: "100%",
    width: "100%",
    position: "absolute",
    bottom: 0,
    zIndex: -1,
  }
});

export default SoundBars;
