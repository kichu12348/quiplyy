import React from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  Text,
  ScrollView,
} from "react-native";
import { useTheme } from "../../../../contexts/theme";
import { useBlog } from "../../../../contexts/BlogContext";
import readingIMG from "./images/readingIMG.jpg";

const Screen2 = ({ navigation }) => {
  const { theme, Icons } = useTheme();
  const { currentBlog } = useBlog();

  return (
    <SafeAreaView style={styles.container(theme)}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton()}
          onPress={() => navigation.goBack()}
        >
          <Image source={Icons.return} style={styles.backIcon} />
          
        </TouchableOpacity>
        <Text style={styles.textStyles(20,"bold",0)}>Back</Text>
      </View>
      <ImageBackground
        style={styles.body}
        source={readingIMG}
        resizeMode="cover"
      >
        <ScrollView>
            <Text style={styles.textStyles(30)}>{currentBlog.title}</Text>
            <Text style={styles.textStyles(20,'200')}>{currentBlog.body}</Text>
        </ScrollView>
        
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Screen2;

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme === "dark" ? "black" : "white",
  }),
  backButton: (marginR = 0) => ({
    marginLeft: 10,
    marginRight: marginR,
  }),
  backIcon: {
    height: 40,
    width: 40,
  },
  header: {
    height: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 20,
  },
  body: {
    flex: 1,
    width: "100%",
  },
  textStyles: (fontSize = 20, fontWeight = "bold",margin=20) => ({
    color:"white", 
    fontSize: fontSize,
    fontWeight: fontWeight,
    margin: margin,
  }),
});
