import React, { useEffect } from "react";
import { View, StyleSheet, Platform,Image} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../../../../../contexts/theme";

const RotatingGradientRing = () => {
  const { background,Icons } = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ringContainer, animatedStyle]}>
        <LinearGradient
          colors={["#FF8C00", "#FF5733", "#C70039", "#900C3F"]}
          style={styles.gradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      <View style={[styles.backgroundRing, { backgroundColor: background }]} >
        <Image source={Icons.ai} style={styles.image} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ringContainer: {
    width: 250,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#FF8C00",
        shadowOpacity: 1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 10,
      },
    }),
  },
  gradientRing: {
    width: "100%",
    height: "100%",
    borderRadius: 125,
  },
  backgroundRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: "center",
    alignItems: "center",
  },
  image:{
    height: 150,
    width: 150,
    alignSelf: "center",
  }
});

export default RotatingGradientRing;
