import { StyleSheet, Platform } from 'react-native';

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
    marginTop: 20,
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
    backgroundColor: theme === "dark" ? "black" : "white",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderRadius: 15,
    ...Platform.select({
      ios: {
        shadowColor: theme === "dark" ? "white" : "black",
        shadowOffset: {
          width: 2,
          height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
        shadowColor: theme === "dark" ? "white" : "black",
      },
    }),
  }),
  Blog: {
    flex: 0.5,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  textInput: (theme, height, textAlign = "flex-start") => ({
    borderRadius: 15,
    minHeight: height,
    maxHeight: "30%",
    width: "90%",
    marginBottom: 10,
    padding: 10,
    textAlign: textAlign,
    color: theme === "dark" ? "white" : "black",
    backgroundColor: theme === "dark" ? "black" : "white",
    ...Platform.select({
      ios: {
        shadowColor: theme === "dark" ? "white" : "black",
        shadowOffset: {
          width: 2,
          height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
        shadowColor: theme === "dark" ? "white" : "black",
      },
    }),
  }),
  KeyboardAvoidingView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  Button: (chatColor) => ({
    width: "90%",
    height: 40,
    backgroundColor: chatColor.sender,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: chatColor.sender,
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
        shadowColor: chatColor.sender,
      },
    }),
  }),
  flex1: {
    flex: 1,
  },
});

export default styles;
