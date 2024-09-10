import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useState, useEffect } from "react";
import { useTheme } from "../../../../contexts/theme";
import { Canvas } from "@react-three/fiber/native";
import { Audio } from "expo-av";
import Render3D from "./utils/3dRender";
import * as SQLite from "expo-sqlite";
import axios from "axios";
import { useSocket } from "../../../../contexts/socketContext";
import { downloadSongFromServer } from "./utils/fileUpload";


const Music = () => {
  const theme = useTheme();
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [songs, setSongs] = useState([]);

  const { endPoint, socket, isConnected } = useSocket();
  axios.defaults.baseURL = `${endPoint}/song`;

  ///sqlite db
  const dbPromise = SQLite.openDatabaseAsync("songs.db");

  async function getSongsFromDB(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT exists songs(
        id TEXT PRIMARY KEY,
        title TEXT,
        image TEXT,
        song TEXT,
        isDownloaded BOOLEAN DEFAULT false
        )
      `);

    const rows = await db.getAllAsync(`SELECT * FROM songs`);
    setSongs(rows);
  }

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
      setPlaybackStatus(status);
    };

    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

    return () => {
      sound.setOnPlaybackStatusUpdate(null);
    };
  }, [sound]);

  async function getSongList() {
    if (!isConnected || !socket) return;
    try {
      await axios.get("/List").then((res) => {
        if (res.data.success) {
          setSongs((prev) => {
            const newSongs = res.data.songList;
            const filteredSongs = newSongs.filter(
              (song) => !prev.find((s) => s.id === song.id)
            );
            filteredSongs.map((s) => {
              s.isDownloaded = false;
            });
            return [...prev, ...filteredSongs];
          });
        }
      });
    } catch (e) {
      return;
    }
  }


  async function downloadSong(item) {
    const { id, title, image, song } = item;
    try {
      const {success,songUri,imageUri}=await downloadSongFromServer(endPoint,song, image);
      if(!success) return;
      const db = await dbPromise;
      await db.runAsync(`
        INSERT INTO songs(id,title,image,song,isDownloaded) VALUES(?,?,?,?,?)
        `,[
          id,
          title,
          imageUri,
          songUri,
          true
        ]);
      setSongs((prev) => {
        const findSong = prev.find((s) => s.id === id);
        if (!findSong) return [...prev, { 
          id: id,
          title: title,
          image: imageUri,
          song: songUri,
          isDownloaded: true,
        }];
        findSong.isDownloaded = true;
        findSong.image = imageUri;
        findSong.song = songUri;
        return [...prev];
      });
    } catch (e) {
      return Alert.alert("Error", "Failed to download song");
    }
  }

  async function start(){
    const db = await dbPromise;
    await getSongsFromDB(db);
    
  }

  useEffect(() => {
    start();
  }, []);


  useEffect(() => {
    getSongList();
  }, [socket, isConnected]);
  

  const loadAndPlaySound = async (audioFile, songTitle) => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: audioFile,
      }, {
        shouldPlay: true,
      });
      setSound(newSound);
      setIsPlaying(true);
      setCurrentPlaying(songTitle);
    } catch (error) {
      return;
    }
  };

  const resumeSound = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  }

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const renderItem = ({ item, index }) => {
    if (!item) return null;
    return (
      <View style={styles.itemContainer()}>
        <TouchableOpacity
          key={`${item.id}-${index}`}
          style={styles.soundBox(theme)}
          onPress={() => {
            if (!item.isDownloaded) {
              downloadSong(item);
              return;
            }
            if(currentPlaying === item.title && !isPlaying){
              resumeSound();
              return;
            }
            if (isPlaying && currentPlaying === item.title) {
              pauseSound();
            } else {
              setPlaybackStatus(null);
              loadAndPlaySound(item.song, item.title);
            }
          }}
        >
          {!item.isDownloaded ? (
            <Image
              source={{ uri: `${endPoint}/song/song?image=${item.image}` }}
              style={styles.audioImage()}
            />
          ) : (
            <Image
              source={{uri:item.image}}
              style={styles.audioImage()}
            />
          )}
          <Text style={styles.text(theme.theme)}>{item.title}</Text>
          {currentPlaying === item.title &&
            playbackStatus?.positionMillis / playbackStatus?.durationMillis !==
              1 && (
              <View
                style={styles.timeStamps(
                  (playbackStatus?.positionMillis /
                    playbackStatus?.durationMillis) *
                    100,
                  theme.theme
                )}
              />
            )}
          <View style={styles.setEnd}>
            {!item.isDownloaded ?(
              <Image
                source={theme.Icons.download}
                style={styles.audioImage(40, 40, 0)}
              />
            ):(
              isPlaying && currentPlaying === item.title &&playbackStatus?.positionMillis!==playbackStatus?.durationMillis? (
                <Image
                  source={theme.Icons.pause}
                  style={styles.audioImage(25, 25, 0,0)}
                />
              ):(
               
                  <Image
                    source={theme.Icons.play}
                    style={styles.audioImage(25, 25, 0,0)}
                  />
              )
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container(theme.theme)}>
      <View style={styles.background}>
        <Canvas
          style={StyleSheet.absoluteFillObject}
          camera={{ position: [2, 3, 5], fov: 30 }}
        >
          <Render3D item={"Cheese"} />
        </Canvas>
      </View>
      <View style={styles.stuffContainer}>
        <FlatList
          data={songs}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
    width: "80%",
    backgroundColor:
      theme.theme === "dark" ? "rgba(15,15,15,0.5)" : "rgba(230,230,230,0.5)",
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 10,
  }),
  audioImage: (h = 80, w = 80, mr = 20,br=10) => ({
    height: h,
    width: w,
    borderRadius: br,
    marginRight: mr,
  }),
  text: (theme) => ({
    color: theme === "dark" ? "white" : "black",
    fontSize: 20,
    fontWeight: "bold",
  }),
  timeStamps: (width, theme) => ({
    position: "absolute",
    width: `${width}%`,
    height: 3,
    bottom: 3,
    left: 10,
    backgroundColor: theme === "dark" ? "white" : "black",
    borderRadius: 10,
  }),
  itemContainer: () => ({
    height: 100,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  }),
  setEnd: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
});
