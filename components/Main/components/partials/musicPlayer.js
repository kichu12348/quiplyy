import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image,Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/theme';
import { Audio } from 'expo-av';
import snowfallImg from './audio/images/snowfall.png';
import calmImg from './audio/images/calmIMG.jpg';
import resoIMG from './audio/images/resoIMG.png';
import snowfall from './audio/snowfall.mp3'
import calm from './audio/calm.mp3'
import reso from './audio/resoH.mp3'

const Music = () => {
  const theme = useTheme();

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSnowfallPlaying, setIsSnowfallPlaying] = useState(false);
  const [isCalmPlaying, setIsCalmPlaying] = useState(false);
  const[isResonancePlaying,setIsResonancePlaying]=useState(false)

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    if (!sound) return;

    const onPlaybackStatusUpdate = (status) => {
      setIsBuffering(status.isBuffering);
      setPlaybackStatus(status);
    };

    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

    return () => {
      sound.setOnPlaybackStatusUpdate(null);
    };
  }, [sound]);

  const loadAndPlaySound = async (audioFile) => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile, {
        shouldPlay: true,
      });
      setSound(newSound);
      setIsPlaying(true);
      if (audioFile === snowfall) {
        setIsSnowfallPlaying(true);
        setIsCalmPlaying(false);
        setIsResonancePlaying(false)
      } else if (audioFile === calm) {
        setIsCalmPlaying(true);
        setIsSnowfallPlaying(false);
        setIsResonancePlaying(false)
      }
      else if(audioFile===reso){
        setIsResonancePlaying(true)
        setIsCalmPlaying(false)
        setIsSnowfallPlaying(false)
      }
    } catch (error) {
      console.log("Error loading sound:", error);
    }
  };

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container(theme.theme)}>
      <View style={styles.stuffContainer}>
        <TouchableOpacity
          style={styles.soundBox(theme.theme)}
          onPress={() => {
            if (isPlaying && isSnowfallPlaying) {
              pauseSound();
            } else {
              loadAndPlaySound(snowfall);
            }
          }}
        >
          <Image source={snowfallImg} style={styles.audioImage} />
          <Text style={styles.text(theme.theme)}>Snowfall</Text>
          {isSnowfallPlaying && playbackStatus?.positionMillis / playbackStatus?.durationMillis !== 1 && (
            <View
              style={styles.timeStamps((playbackStatus?.positionMillis / playbackStatus?.durationMillis) * 100,theme.theme)}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.soundBox(theme.theme)}
          onPress={() => {
            if (isPlaying && isCalmPlaying) {
              pauseSound();
            } else {
              loadAndPlaySound(calm);
            }
          }}
        >
          <Image source={calmImg} style={styles.audioImage} />
          <Text style={styles.text(theme.theme)}>Calm</Text>
          {isCalmPlaying && playbackStatus?.positionMillis / playbackStatus?.durationMillis !== 1 && (
            <View
              style={
                styles.timeStamps((playbackStatus?.positionMillis / playbackStatus?.durationMillis) * 100,theme.theme)
                }
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.soundBox(theme.theme)}
          onPress={() => {
            if (isPlaying && isCalmPlaying) {
              pauseSound();
            } else {
              loadAndPlaySound(reso);
            }
          }}
        >
          <Image source={resoIMG} style={styles.audioImage} />
          <Text style={styles.text(theme.theme)}>Resonance</Text>
          {isResonancePlaying && playbackStatus?.positionMillis / playbackStatus?.durationMillis !== 1 && (
            <View
              style={
                styles.timeStamps((playbackStatus?.positionMillis / playbackStatus?.durationMillis) * 100,theme.theme)
                }
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Music;

const styles = StyleSheet.create({
  container: (theme) => ({
    width: '100%',
    flex: 1,
    backgroundColor: theme === 'dark' ? 'black' : 'white',
  }),
  stuffContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundBox: (theme) => ({
    height: 100,
    width: '80%',
    backgroundColor: theme === 'dark' ? 'black' : 'white',
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    margin: 10,
    ...Platform.select({
      ios: {
        shadowColor: theme === 'dark' ? 'white' : 'black',
        shadowOffset: {
          width: 2,
          height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 10,
        shadowColor: theme === 'dark' ? 'white' : 'black',
      },
    }),
    padding: 10,
  }),
  audioImage: {
    height: 80,
    width: 80,
    borderRadius: 10,
    marginRight: 20,
  },
  text: (theme) => ({
    color: theme === 'dark' ? 'white' : 'black',
    fontSize: 20,
    fontWeight: 'bold',
  }),
  timeStamps:(width,theme)=>({
    position: 'absolute',
    width:`${width}%`,
    height: 3,
    bottom: 3,
    left:10,
    backgroundColor: theme==="dark"?"white":"black",
    borderRadius: 10,
  }),
});
