import React, { memo } from "react";
import { Text, View, StyleSheet, TextInput } from "react-native";
import { useTheme } from "../../../../../contexts/theme";

//dis code made me see stars 💀 welp such is such
const RenderList = memo(({ item }) => {
  const { theme } = useTheme();
  let currIndex = 0;


  const parseMessage = (item) => {
    if (item.role === "user") {
      return <Text style={styles.textStyles(theme)}>{item.parts[0].text}</Text>;
    }

    const needsFormatting = (text) => {
      const formattingPatterns = [
        /```/, // Code blocks
        /\*\*(.*?)\*\*/, // Bold text
        /^[•*]\s/m, // Bullet points
        /^\d+\.\s/m, // Numbered lists
        /`([^`]+)`/, // Inline code
      ];

      return formattingPatterns.some((pattern) => pattern.test(text));
    };


    if(!needsFormatting(item.parts[0].text)){
        return <Text style={styles.textStyles(theme)}>{item.parts[0].text}</Text>;
    }

    const msg = item.parts[0].text;
    const parts = msg.split(/(```.*?```|\*\*.*?\*\*|\n)/gs);
    let isInsideCodeBlock = false;

    return parts.map((part, index) =>
      renderPart(part, index, isInsideCodeBlock, parts)
    );
  };

  const renderPart = (part, index, isInsideCodeBlock, parts) => {
    if (part === "" || (index !== 0 && index === currIndex)) return null;
    if (part === "\n")
      return (
        <Text key={index} style={styles.textStyles(theme)}>
          {""}
        </Text>
      );

    const codePattern = /```(.*?)```/gs;
    const boldPattern = /\*\*(.*?)\*\*/g;
    const bulletPattern = /^[•*]\s*(.*)$/gm;
    const numberedPattern = /^\d+\.\s*(.*)$/gm;

    if (codePattern.test(part.trim())) {
      isInsideCodeBlock = !isInsideCodeBlock;
      return renderCodeBlock(part, index, theme);
    } else if (isInsideCodeBlock) {
      return renderCodeBlockContent(part, index, theme);
    } else if (boldPattern.test(part.trim())) {
      return renderBoldText(part, index, theme);
    } else if (bulletPattern.test(part.trim())) {
      return renderBulletList(part, index, theme, parts);
    } else if (numberedPattern.test(part)) {
      return renderNumberedList(part, index, theme, parts);
    } else {
      return renderPlainText(part, index, theme);
    }
  };

  const renderCodeBlock = (part, index, theme) => (
    <View key={index} style={styles.codeBlock(theme)}>
      <TextInput
        style={styles.codeColor(theme)}
        multiline={true}
        readOnly={true}
        value={part.replace(/```/g, "").trim()}
      />
    </View>
  );

  const renderCodeBlockContent = (part, index, theme) => {
    const nrmTxt = part
      .split(/(```.*?```|\*\*.*?\*\*|\n)/gs)
      .filter((e) => e !== "");
    return nrmTxt.map((txt, idx) =>
      renderCodeBlockPart(txt, index, idx, theme)
    );
  };

  const renderCodeBlockPart = (txt, index, idx, theme) => {
    const boldPattern = /\*\*(.*?)\*\*/g;
    const bulletPattern = /^[•*]\s*(.*)$/gm;
    const numberedPattern = /^\d+\.\s*(.*)$/gm;

    if (boldPattern.test(txt.trim())) {
      return renderBoldText(txt, `${index}-${idx}`, theme);
    } else if (bulletPattern.test(txt.trim())) {
      return renderBulletList(txt, `${index}-${idx}`, theme);
    } else if (numberedPattern.test(txt.trim())) {
      return renderNumberedList(txt, `${index}-${idx}`, theme);
    } else {
      return renderPlainText(txt, `${index}-${idx}`, theme);
    }
  };

  const renderBoldText = (part, index, theme) => (
    <Text key={index} style={styles.textStyles(theme, "bold")}>
      {parseTextForBox(part.replace(/\*\*/g, "").trim(), "bold")}
    </Text>
  );

  const renderBulletList = (part, index, theme, parts) => {
    const matches = part.trim().match(/^[•*]\s*(.*)$/gm);
    if (!matches) return null;

    return matches.map((bullet, bulletIndex) => {
      const bulletText = bullet.replace(/^[•*]\s*/, "");
      const boldMatches = bulletText.match(/\*\*(.*?)\*\*/g);
      const textWithoutBold = bulletText.replace(/\*\*(.*?)\*\*/g, "").trim();

      const nextPart = parts[index + 1];
      const checkIfNextPartIsBold =
        nextPart && nextPart.match(/\*\*(.*?)\*\*/g);

      if (checkIfNextPartIsBold && checkIfNextPartIsBold[0]) {
        currIndex = index + 1;
        return (
          <View key={`${index}-${bulletIndex}`} style={styles.listItem}>
            <Text style={styles.bulletPoint(theme)}>•</Text>
            <Text
              style={[styles.textStyles(theme, "bold"), styles.listItemText]}
            >
              {parseTextForBox(
                checkIfNextPartIsBold[0].replace(/\*\*/g, "").trim()
              )}
            </Text>
          </View>
        );
      }

      return (
        <View key={`${index}-${bulletIndex}`} style={styles.listItem}>
          <Text style={styles.bulletPoint(theme)}>•</Text>
          <Text style={[styles.textStyles(theme), styles.listItemText]}>
            {boldMatches && boldMatches.length > 0 && (
              <Text style={{ fontWeight: "bold" }}>
                {parseTextForBox(boldMatches[0].replace(/\*\*/g, "").trim())}{" "}
              </Text>
            )}
            {parseTextForBox(textWithoutBold)}
          </Text>
        </View>
      );
    });
  };

  const renderNumberedList = (part, index, theme, parts) => {
    const matches = part.trim().match(/^\d+\.\s*(.*)$/gm);
    if (!matches) return null;

    return matches.map((numbered, bulletIndex) => {
      const [number, text] = numbered.split(". ");
      const nextPart = parts[index + 1];
      const checkIfNextPartIsBold =
        nextPart && nextPart.match(/\*\*(.*?)\*\*/g);

      if (checkIfNextPartIsBold && checkIfNextPartIsBold[0]) {
        currIndex = index + 1;
        return (
          <View key={`${index}-${bulletIndex}`} style={styles.listItem}>
            <Text style={[styles.textStyles(theme, "bold")]}>
              {parseTextForBox(
                `${number}. ${checkIfNextPartIsBold[0]
                  .replace(/\*\*/g, "")
                  .trim()}`
              )}
            </Text>
          </View>
        );
      }

      return (
        <View key={`${index}-${bulletIndex}`} style={styles.listItem}>
          <Text style={styles.textStyles(theme)}>{number}.</Text>
          <Text style={[styles.textStyles(theme), styles.listItemText]}>
            {parseTextForBox(text)}
          </Text>
        </View>
      );
    });
  };

  const renderPlainText = (part, index, theme) => (
    <Text key={index} style={styles.textStyles(theme)}>
      {parseTextForBox(part.trim())}
    </Text>
  );

  const parseTextForBox = (text, fw = "400") => {
    const inlineCodePattern = /`([^`]+)`/g;
    const parts = text.split(inlineCodePattern);

    if (parts.length === 1) {
      return <Text style={styles.textStyles(theme, fw)}>{text}</Text>;
    }

    return (
      <>
        {parts.map((part, index) => {
          if (index % 2 !== 0) {
            return (
              <View key={index} style={styles.inlineCodeBox(theme)}>
                <Text style={styles.inlineCode(theme, fw)}>{part}</Text>
              </View>
            );
          }
          return (
            <Text key={index} style={styles.textStyles(theme, fw)}>
              {part}
            </Text>
          );
        })}
      </>
    );
  };

  return (
    <View
      style={[
        styles.messageContainer,
        { justifyContent: item.role === "user" ? "flex-end" : "flex-start" },
      ]}
    >
      <View
        style={
          item.role === "user"
            ? styles.userMessage(theme)
            : styles.aiMessage(theme)
        }
      >
        {parseMessage(item)}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  userMessage: (theme) => ({
    backgroundColor:
      theme === "dark" ? "rgba(0, 122, 255, 0.8)" : "rgba(0, 255, 0, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    maxWidth: "90%",
  }),
  aiMessage: (theme) => ({
    backgroundColor:
      theme === "dark" ? "rgba(30, 30, 30, 0.8)" : "rgba(224, 224, 224, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    maxWidth: "90%",
  }),
  textStyles: (theme, fw = "400") => ({
    color: theme === "dark" ? "#E0E0E0" : "#2D2D2D", 
    fontSize: 16,
    fontWeight: fw,
  }),
  codeBlock: (theme) => ({
    backgroundColor: theme === "dark" ? "#333" : "#f4f4f4", 
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme === "dark" ? "#555" : "#ccc",
  }),
  codeColor: (theme) => ({
    color: theme === "dark" ? "#00FF00" : "rgba(0,0,250,0.7)", // Light green for dark mode, dark blue for light mode
    fontSize:16,
    fontWeight:"400"
  }),
  messageContainer: {
    flexDirection: "row",
    marginVertical: 5,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 2,
  },
  listItemText: {
    marginLeft: 5,
    flex: 1,
  },
  bulletPoint: (theme) => ({
    color: theme === "dark" ? "#E0E0E0" : "#2D2D2D", 
  }),
  inlineCodeBox: (theme) => ({
    backgroundColor: theme === "dark" ? "#444" : "#ececec",
    paddingHorizontal: 5,
    marginHorizontal: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme === "dark" ? "#555" : "#ccc",
  }),
  inlineCode: (theme, fw = "400") => ({
    color: theme === "dark" ? "#FFD700" : "#757575",
    fontSize: 16,
    fontWeight: fw,
  }),
});

export default RenderList;
