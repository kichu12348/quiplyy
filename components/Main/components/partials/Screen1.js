import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useTheme } from "../../../../contexts/theme";
import { useSocket } from "../../../../contexts/socketContext";
import AddBlogs from "./addBlogs";
import { useBlog } from "../../../../contexts/BlogContext";

const Screen1 = ({ navigation }) => {
  const { theme, Icons } = useTheme();
  const { isConnected, supabase } = useSocket();
  const [blogs, setBlogs] = useState([]);
  const [isAddBlog, setIsAddBlog] = useState(false);

  const { setCurrentBlog } = useBlog();

  const trimAndSlice = (inputStr) => {
    let trimmedStr = inputStr.trim().replace(/[\s\n]+/g, " ");
    let slicedStr = trimmedStr.slice(0, 100);
    return slicedStr;
  };

  const getBlogs = async () => {
    if (!isConnected) return;
    const { data, error } = await supabase.from("blogs").select("*");
    if (error) {
      console.log(error);
    } else {
      setBlogs(data);
    }
  };

  openBlog = (blog) => {
    setCurrentBlog(blog);
    navigation.navigate("Blog");
  };

  useEffect(() => {
    getBlogs();
  }, []);

  const RenderItem = ({ item }) => {
    return item ? (
      <TouchableOpacity
        style={styles.itemContainer(theme)}
        key={item.id}
        onPress={() => openBlog(item)}
      >
        <View style={styles.blogContainer(theme)}>
          <Text style={styles.textStyles(theme)}>{item.title}</Text>
          <Text style={styles.textStyles(theme, 15, '200')}>
            {item.body.length > 100
              ? trimAndSlice(item.body) + "..."
              : item.body}
          </Text>
        </View>
      </TouchableOpacity>
    ) : null;
  };

  return (
    <SafeAreaView style={styles.container(theme)}>
      <View style={styles.header}>
        <View style={styles.Blog}>
          <TouchableOpacity
            style={styles.backButton()}
            onPress={() => navigation.goBack()}
          >
            <Image source={Icons.return} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.title(theme)}>Blogs</Text>
        </View>
        <TouchableOpacity
          style={styles.backButton(15)}
          disabled={!isConnected}
          onPress={() => setIsAddBlog(true)}
        >
          <Image source={Icons.add} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <FlatList
          data={blogs}
          renderItem={RenderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <Modal
        transparent={true}
        animationType="slide"
        hardwareAccelerated={true}
        visible={isAddBlog}
        onRequestClose={() => setIsAddBlog(false)}
      >
        <AddBlogs
          setIsAddBlog={setIsAddBlog}
          supabase={supabase}
          setBlogs={setBlogs}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default Screen1;

const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    backgroundColor: theme === "dark" ? "black" : "white",
    justifyContent: "center",
    alignItems: "center",
  }),
  textStyles: (theme, fontSize = 20, fontWeight = "bold") => ({
    color: theme === "dark" ? "white" : "black",
    fontSize: fontSize,
    fontWeight: fontWeight,
  }),
  header: {
    height: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: (theme) => ({
    color: theme === "dark" ? "white" : "black",
    fontSize: 30,
    fontWeight: "bold",
    marginLeft: 20,
  }),
  backButton: (marginR = 0) => ({
    marginLeft: 10,
    marginRight: marginR,
  }),
  backIcon: {
    height: 40,
    width: 40,
  },
  body: {
    flex: 1,
    width: "100%",
  },
  itemContainer: (theme) => ({
    height: 180,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  }),
  blogContainer: (theme) => ({
    width: "90%",
    height: "90%",
    padding: 10,
    flexDirection: "column",
    backgroundColor: theme==="dark"?"#212121":"#e0e0e0",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderRadius: 15,
  }),
  Blog: {
    flex: 0.5,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
});
