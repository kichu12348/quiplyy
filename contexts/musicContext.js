import { useContext, createContext, useMemo, useState, useEffect } from "react";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as SQLite from "expo-sqlite";
import { useSocket } from "./socketContext";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [songs, setSongs] = useState([]);
  const [current, setCurrent] = useState(null);

  const { socket, isConnected, supabase } = useSocket();

  ///sqlite db
  const dbPromise = SQLite.openDatabaseAsync("songs.db");

  async function getSongsFromDB(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS songs(
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

  async function downloadSong(item) {
    const { id, title, image, song } = item;
    try {
      const fileUri = `${FileSystem.documentDirectory}${song}`;
      const imageUri = `${FileSystem.documentDirectory}${image}`;
      const serverUri = `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public`;
      const songRes = await FileSystem.downloadAsync(
        `${serverUri}/songs/${song}`,
        fileUri
      );
      const imageRes = await FileSystem.downloadAsync(
        `${serverUri}/songImg/${image}`,
        imageUri
      );
      if (
        !songRes ||
        !imageRes ||
        songRes.status !== 200 ||
        imageRes.status !== 200
      )
        return Alert.alert("Error", "Could not download song");
      const db = await dbPromise;
      await db.runAsync(
        `INSERT OR REPLACE INTO songs (id, title, image, song, isDownloaded) VALUES (?, ?, ?, ?, ?)`,
        [id, title, imageRes.uri, songRes.uri, true]
      );
      setSongs((prev) => {
        const sng = prev.find((s) => s.id === id);
        if (sng) {
          sng.isDownloaded = true;
          sng.image = imageRes.uri;
          sng.song = songRes.uri;
        }
        return [...prev];
      });
    } catch (e) {
      Alert.alert("Error", "Could not download song");
    }
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
      if (status.didJustFinish) {
        setPlaybackStatus(null);
        const currentSongIdx = songs.findIndex(
          (s) => s.title === currentPlaying
        );
        const nextSong =
          currentSongIdx === songs.length - 1
            ? songs[0]
            : songs[currentSongIdx + 1];
        setSound(null);
        setCurrent(nextSong);
        loadAndPlaySound(nextSong.song, nextSong.title);
        return;
      }
      setPlaybackStatus(status);
    };

    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

    return () => {
      sound.setOnPlaybackStatusUpdate(null);
    };
  }, [sound]);

  async function getSongList() {
    if (!isConnected) return;
    try {
      const { data, error } = await supabase.from("songs").select("*");
      if (error) return;
      setSongs((prev) => {
        const newSongs = data;
        const filteredSongs = newSongs.filter(
          (song) => !prev.find((s) => s.id === song.id)
        );
        filteredSongs.map((s) => {
          s.isDownloaded = false;
        });
        return [...prev, ...filteredSongs];
      });
    } catch (e) {
      return;
    }
  }

  async function start() {
    const db = await dbPromise;
    await getSongsFromDB(db);
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: true,
    });
  }

  useEffect(() => {
    start();
  }, []);

  

  useEffect(() => {
    getSongList();
  }, [socket, isConnected]);

  const loadAndPlaySound = async (audioFile, songTitle) => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        {
          uri: audioFile,
        },
        {
          shouldPlay: true,
        }
      );
      setSound(newSound);
      setIsPlaying(true);
      setCurrentPlaying(songTitle);
    } catch (error) {
      return;
    }
  };

  const resumeSound = async () => {
    if (sound && !isPlaying) {
      await sound.setVolumeAsync(1);
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const fadeOutAndPause = async (playbackObject, fadeDuration = 300) => {
    const status = await playbackObject.getStatusAsync();
    const initialVolume = status.volume;
    const fadeSteps = 10;
    const fadeInterval = fadeDuration / fadeSteps;
    let currentVolume = initialVolume;

    const fadeOutInterval = setInterval(async () => {
      if (currentVolume > 0) {
        currentVolume -= initialVolume / fadeSteps;
        currentVolume = Math.max(currentVolume, 0);
        await playbackObject.setVolumeAsync(currentVolume);
      } else {
        clearInterval(fadeOutInterval);
        await playbackObject.pauseAsync();
      }
    }, fadeInterval);
  };

  const pauseSound = async () => {
    if (sound) {
      await fadeOutAndPause(sound);
      setIsPlaying(false);
    }
  };

  const value = useMemo(
    () => ({
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
    }),
    [sound, isPlaying, playbackStatus, currentPlaying, songs, current]
  );

  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  return context;
};
