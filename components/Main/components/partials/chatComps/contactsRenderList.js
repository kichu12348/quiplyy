import { useState, useEffect, memo } from "react";
import { TouchableOpacity, Text, View} from "react-native";
import { useSocket } from "../../../../../contexts/socketContext";
import { useAuth } from "../../../../../contexts/authContext";
import { useTheme } from "../../../../../contexts/theme";
import { LinearGradient } from "expo-linear-gradient";
import {Image} from 'expo-image';

const RenderList = memo(
  ({
    item,
    isQuerying,
    addContact,
    setMessager,
    setIsStory,
    setIsStoryUri,
  }) => {
    const [storyUri, setStoryUri] = useState(null);
    const { isConnected } = useSocket();
    const auth = useAuth();
    const theme = useTheme();

    const shortenName = (name) => {
      return name.length > 20 ? name.slice(0, 20) + "..." : name;
    };

    function getStory() {
      if (!isConnected) return;
      const { allStories } = auth;
      if (!allStories || allStories.length === 0) return;
      const story = allStories.find((e) => e.id === item.id);
      if (!story) return;
      setStoryUri(story.storyUri);
    }

    useEffect(() => {
      getStory();
    }, [auth.allStories]);

    const openStory = () => {
      if (!storyUri) return;
      setIsStory(true);
      setIsStoryUri(
        `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/stories/${storyUri}?time=${new Date().getHours()}`
      );
    };

    return item && item.id ? (
      <TouchableOpacity
        style={styles.listItem(theme)}
        onPress={() => {
          isQuerying ? addContact(item.id) : setMessager({ ...item });
        }}
        key={item.id}
      >
        {!item.isGroup ? (
          <TouchableOpacity
            style={styles.centerDiv}
            disabled={!isConnected || !storyUri}
            onPress={openStory}
          >
            <LinearGradient
              colors={
                storyUri
                  ? [
                      "#FF8C00" /* Dark Orange */,
                      "#FFB600" /* Bright Yellow */,
                      "#FF5733" /* Fiery Red-Orange */,
                      "#C70039" /* Dark Red */,
                      "#900C3F" /* Deep Magenta */,
                      "#581845" /* Dark Purple */,
                    ]
                  : ["transparent", "transparent"]
              }
              style={styles.circle(55, "transparent", storyUri)}
            >
              <View style={styles.circle(50, theme.background)}>
                <Image
                  source={{
                    uri: `https://vevcjimdxdaprqrdbptj.supabase.co/storage/v1/object/public/profilePictures/${item.username.trim()}.jpg?time=${new Date().getHours()}`,
                  }}
                  style={styles.Image(0, 50)}
                  cachePolicy={"none"}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <Image source={theme.Icons.group} style={styles.Image(0, 50)} />
        )}

        <Text
          style={styles.textStyles(theme.theme === "dark" ? "white" : "black")}
        >
          {shortenName(item.username)}
        </Text>
      </TouchableOpacity>
    ) : null;
  }
);

export default RenderList;

const styles = {
  listItem: (theme) => ({
    padding: 10,
    backgroundColor: theme.theme === "dark" ? "#212121" : "#e0e0e0",
    margin: 5,
    marginLeft: 10,
    width: "95%",
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 25,
  }),
  centerDiv: {
    alignItems: "center",
    justifyContent: "center",
  },
  circle: (r, c = "transparent") => ({
    height: r,
    width: r,
    borderRadius: r / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c,
  }),
  Image: (mr = 0, s = 40) => ({
    height: s,
    width: s,
    borderRadius: 25,
    alignSelf: "center",
    marginRight: mr,
  }),
  textStyles: (color) => ({
    color: color,
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 30,
  }),
};
