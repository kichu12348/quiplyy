import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useTheme } from "../../../../contexts/theme";
import SoundBars from "./utils/soundBars";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import ProgressBar from "./utils/progressBar";
import { useMusic } from "../../../../contexts/musicContext";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";

const Music = () => {
  const theme = useTheme();
  const {
    sound,
    isPlaying,
    playbackStatus,
    currentPlaying,
    songs,
    current,
    loadAndPlaySound,
    resumeSound,
    pauseSound,
    downloadSong,
    setPlaybackStatus,
    setCurrent,
  } = useMusic();

  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [volumes, setVolumes] = useState([0.5, 0.7, 0.3, 0.9, 0.2]);

  const footerHeight = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: footerHeight.value,
    };
  });

  const startAnimation = (state) => {
    if (current) return;
    footerHeight.value = withTiming(state ? 100 : 0, {
      duration: 300,
      easing: Easing.in,
    });
  };

  const openPlayerComplete = () => {
    setIsPlayerOpen((prev) => {
      if (!prev) {
        footerHeight.value = withTiming(400, {
          duration: 200,
          easing: Easing.in,
        });
      }
      if (prev) {
        footerHeight.value = withTiming(100, {
          duration: 200,
          easing: Easing.in,
        });
      }
      return !prev;
    });
  };

  const durWidth = useSharedValue(0);
  const durAnim = useAnimatedStyle(() => {
    return {
      width: `${durWidth.value}%`,
    };
  });

  const updateDur = (status) => {
    if (!status) return;
    const newVolumes = Array(5)
      .fill(0)
      .map(() => Math.random());
    setVolumes(newVolumes);

    if (status.didJustFinish) {
      durWidth.value = withTiming(100, {
        duration: 100,
        easing: Easing.linear,
      });
      return;
    }
    durWidth.value = withTiming(
      (status.positionMillis / status.durationMillis) * 100,
      {
        duration: 1000,
        easing: Easing.linear,
      }
    );
  };

  useEffect(() => {
    updateDur(playbackStatus);
  }, [playbackStatus]);

  useEffect(() => {
    if (isPlaying || current) {
      footerHeight.value = 100;
      if (playbackStatus) {
        durWidth.value =
          (playbackStatus.positionMillis / playbackStatus.durationMillis) * 100;
      }
    }
  }, []);

  const renderItem = ({ item, index }) => {
    if (!item || !item.title) return null;
    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          key={`${item.id}-${index}`}
          style={styles.soundBox(theme)}
          onPress={() => {
            if (!item.isDownloaded) {
              downloadSong(item);
              return;
            }
            if (currentPlaying === item.title && !isPlaying) {
              resumeSound();
              return;
            }
            if (isPlaying && currentPlaying === item.title) {
              pauseSound();
            } else {
              setPlaybackStatus(null);
              loadAndPlaySound(item.song, item.title);
              setCurrent(item);
              startAnimation(true);
            }
          }}
        >
          <BlurView
            intensity={90}
            style={styles.blur}
            tint={theme.theme === "dark" ? "dark" : "light"}
          >
            {!item.isDownloaded ? (
              <Image
                source={{
                  uri: `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/songImg/${item.image}`,
                }}
                style={styles.audioImage()}
              />
            ) : (
              <Image source={{ uri: item.image }} style={styles.audioImage()} />
            )}
            <Text style={styles.text(theme.theme)}>{item.title}</Text>

            <View style={styles.setEnd}>
              {!item.isDownloaded && (
                <Image
                  source={theme.Icons.download}
                  style={styles.audioImage(40, 40, 0)}
                />
              )}
            </View>
          </BlurView>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container(theme.theme)}>
      <View style={styles.background}>
        <SoundBars volumes={volumes} />
      </View>
      <View style={styles.stuffContainer}>
        <FlatList
          data={songs}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <Animated.View style={[styles.footer, animatedStyle]}>
        {current && (
          <TouchableOpacity
            onPress={openPlayerComplete}
            style={styles.player(theme.theme, isPlayerOpen)}
            disabled={isPlayerOpen}
          >
            {isPlayerOpen && (
              <TouchableOpacity
                onPress={openPlayerComplete}
                style={styles.rotImage(40, 40, 0, 0, 270)}
              >
                <Image
                  source={theme.Icons.return}
                  style={styles.rotImage(40, 40, 0, 0, 0)}
                />
              </TouchableOpacity>
            )}
            {!isPlayerOpen ? (
              <>
                <Image
                  source={{
                    uri: current?.image,
                  }}
                  style={styles.audioImage(45, 45, 0, 5)}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (isPlaying) {
                      pauseSound();
                    } else {
                      resumeSound();
                    }
                  }}
                >
                  {isPlaying ? (
                    <Image
                      source={theme.Icons.pause}
                      style={styles.audioImage(25, 25, 0, 0)}
                    />
                  ) : (
                    <Image
                      source={theme.Icons.play}
                      style={styles.audioImage(25, 25, 0, 0)}
                    />
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.advPlayer}>
                <Image
                  source={{
                    uri: current?.image,
                  }}
                  style={styles.audioImage(150, 150, 0, 5)}
                />

                <Text style={styles.text(theme.theme)}>{current?.title}</Text>
                <ProgressBar
                  theme={theme.theme}
                  playbackStatus={playbackStatus}
                  sound={sound}
                  isPlaying={isPlaying}
                />
                <View style={styles.circle(50, theme.theme)}>
                  <TouchableOpacity
                    onPress={() => {
                      if (isPlaying) {
                        pauseSound();
                      } else {
                        resumeSound();
                      }
                    }}
                  >
                    {isPlaying ? (
                      <Image
                        source={
                          theme.theme === "dark"
                            ? theme.lightIcons.pause
                            : theme.darkIcons.pause
                        }
                        style={styles.audioImage(25, 25, 0, 0)}
                      />
                    ) : (
                      <Image
                        source={
                          theme.theme === "dark"
                            ? theme.lightIcons.play
                            : theme.darkIcons.play
                        }
                        style={styles.audioImage(25, 25, 0, 0)}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!isPlayerOpen && (
              <Animated.View style={[styles.dur(3, theme.theme), durAnim]} />
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

export default Music;

const styles = StyleSheet.create({
  container: (theme) => ({
    width: "100%",
    flex: 1,
    backgroundColor: theme === "dark" ? "black" : "white",
  }),
  background: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  stuffContainer: {
    flex: 1,
  },
  soundBox: (theme) => ({
    height: 100,
    width: "90%",
    ...Platform.select({
      ios: {
        backgroundColor: null,
      },
      android: {
        backgroundColor:
          theme.theme === "dark"
            ? "rgba(15,15,15,0.5)"
            : "rgba(230,230,230,0.5)",
      },
    }),
    borderRadius: 15,
    overflow: "hidden",
  }),
  audioImage: (h = 80, w = 80, mr = 20, br = 10) => ({
    height: h,
    width: w,
    borderRadius: br,
    marginRight: mr,
    alignSelf: "center",
  }),
  text: (theme) => ({
    color: theme === "dark" ? "white" : "black",
    fontSize: 20,
    fontWeight: "bold",
  }),
  itemContainer: {
    height: 100,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  setEnd: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  footer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  player: (theme = "dark", isOpen) => ({
    height: isOpen ? "95%" : "70%",
    width: "90%",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: isOpen ? "flex-start" : "space-between",
    gap: isOpen ? 20 : 0,
    flexDirection: isOpen ? "column" : "row",
    paddingHorizontal: 20,
    paddingVertical: isOpen ? 10 : 0,
    backgroundColor:
      theme === "dark" ? "rgba(15,15,15,1)" : "rgba(230,230,230,1)",
    ...Platform.select({
      ios: {
        shadowColor:
          theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
        shadowOffset: {
          width: 2,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
        shadowColor:
          theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
      },
    }),
  }),
  dur: (h = 3, theme = "dark") => ({
    height: h,
    backgroundColor: theme === "dark" ? "white" : "rgb(45,45,45)",
    borderRadius: 10,
    position: "absolute",
    bottom: 0,
    left: "6%",
  }),
  rotImage: (h = 80, w = 80, mr = 20, br = 10, rot = 90) => ({
    height: h,
    width: w,
    borderRadius: br,
    marginRight: mr,
    transform: [{ rotate: `${rot}deg` }],
    alignSelf: "center",
  }),
  advPlayer: {
    minHeight: "50%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  circle: (r = 50, theme) => ({
    height: r,
    width: r,
    borderRadius: r / 2,
    backgroundColor: theme === "dark" ? "white" : "rgb(45,45,45)",
    justifyContent: "center",
    alignItems: "center",
  }),
  blur: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 10,
  },
});
