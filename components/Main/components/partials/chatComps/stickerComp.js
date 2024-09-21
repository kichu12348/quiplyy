import {memo} from "react";
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../../../../../contexts/theme";

const StickerComponent =memo(({
  stickers,
  stickerList,
  setIsSticker,
  sendSticker,
}) => {

    const {Icons}= useTheme();

    const rowLength =
    stickerList.length % 3 === 0
      ? stickerList.length / 3
      : Math.floor(stickerList.length / 3) + 1;


  const StickerItem = ({ stickersL }) => {
    return (
      <>
        {stickersL.map((sticker, index) => {
          return sticker ? (
            <TouchableOpacity
              key={sticker.id}
              onPress={() => sendSticker(sticker.name)}
            >
              <Image
                source={stickers[sticker.name]}
                style={styles.Image(10, 10, 100, 100, 20)}
              />
            </TouchableOpacity>
          ) : (
            <View key={`empty-${index}`} />
          );
        })}
      </>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={() => setIsSticker(false)}>
      <View style={styles.stickerModal}>
        <BlurView intensity={300} style={styles.stickerContainer()}>
          <View style={styles.stickerHeader}>
            <TouchableOpacity
              style={styles.Image(10, 20, 40, 40, 0, "flex-start")}
              onPress={() => setIsSticker(false)}
            >
              <Image
                source={Icons.return}
                style={styles.Image(10, 20, 40, 40, 0, "flex-start")}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.stickers}>
            <ScrollView scrollEnabled={true} style={styles.ScrollView}>
              {stickerList.length > 0
                ? (() => {
                    const stickerItems = [];
                    for (let index = 0; index < rowLength; index++) {
                      const stickerRow = [
                        stickerList[index * 3],
                        stickerList[index * 3 + 1] || null,
                        stickerList[index * 3 + 2] || null,
                      ];

                      stickerItems.push(
                        <View key={`row-${index}`} style={styles.rows}>
                          <StickerItem stickersL={stickerRow} />
                        </View>
                      );
                    }
                    return stickerItems;
                  })()
                : null}
            </ScrollView>
          </View>
        </BlurView>
      </View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  stickerModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  stickerContainer: () => ({
    height: "50%",
    width: "100%",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    zIndex: 10,
  }),
  stickerHeader: {
    height: "10%",
    width: "100%",
    backgroundColor: "transparent",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  stickers: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  rows: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    margin: 10,
  },
  ScrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  Image: (
    marginLeft = 0,
    marginR = 0,
    height = 40,
    width = 40,
    borderRadius = 0,
    alignSelf = "center"
  ) => ({
    height: height,
    width: width,
    marginLeft: marginLeft,
    marginRight: marginR,
    borderRadius: borderRadius === 0 ? height / 2 : borderRadius,
    alignSelf: alignSelf,
  }),
});

export default StickerComponent;
