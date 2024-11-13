import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from "react-native";
import { useTheme } from "../../../../contexts/theme";
import { Chess } from "chess.js";
import Chessboard from "react-native-chessboard"; // Fix import
import Icon from "./utils/icons";


const ChessJs = ({ navigation }) => {
  const { theme } = useTheme();

  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [playerColor, setPlayerColor] = useState("w");
  const [isWhiteCheck, setIsWhiteCheck] = useState(false);
  const [isBlackCheck, setIsBlackCheck] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [isDraw, setIsDraw] = useState(false);
  const [winner, setWinner] = useState(null);
  const chessBoardRef = useRef(null);

  const handleMove = async ({ move, state }) => {
    try {
      game.move(move); // Make the move first
      const { in_checkmate, in_draw, in_check } = state;
      setFen(game.fen());
      
      if (in_checkmate) {
        setIsCheckmate(true);
        setWinner(move.color === "w" ? "White" : "Black");
        setTimeout(() => {
          setIsCheckmate(false);
          resetGame();
        }, 5000);
      } else if (in_check) {
        if (move.color === "w") {
          setIsWhiteCheck(true);
          setTimeout(() => setIsWhiteCheck(false), 3000);
        } else {
          setIsBlackCheck(true);
          setTimeout(() => setIsBlackCheck(false), 3000);
        }
      } else if (in_draw) {
        setIsDraw(true);
        setTimeout(() => {
          setIsDraw(false);
          resetGame();
        }, 5000);
      }
    } catch (e) {
      console.error("Error in handleMove:", e);
    }
  };

  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setIsBlackCheck(false);
    setIsWhiteCheck(false);
    setIsCheckmate(false);
    setIsDraw(false);
    setWinner(null);
  }, []);

  return (
    <SafeAreaView style={styles.container(theme)}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="ChevronLeft" size={40} />
        </TouchableOpacity>
        <Icon name="Gamepad" size={40} />
      </View>
      <View style={styles.body}>
        <Text style={styles.status(theme, true)}>
          {isBlackCheck ? "Check!" : null}
        </Text>
        <Chessboard
          fen={fen}
          playerColor={playerColor}
          onMove={handleMove}
        />
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.button(false, theme)}
            onPress={resetGame}
          >
            <Text style={styles.textStyles(theme, 16, "white")}>
              Reset Game
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.status(theme)}>
          {isWhiteCheck ? "Check!" : null}
        </Text>
      </View>
      <Modal
        visible={isCheckmate || isDraw}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.isPage}>
          <Text style={styles.textStyles(theme)}>
            {winner ? `${winner} wins` : "It's a Draw!!!"}
          </Text>
          <TouchableOpacity
            style={styles.button(false, theme)}
            onPress={resetGame}
          >
            <Text style={styles.textStyles(theme, 16)}>Reset Game</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: (theme) => ({
    flex: 1,
    backgroundColor: theme === "dark" ? "black" : "white",
    justifyContent: "flex-start",
    alignItems: "center",
  }),
  textStyles: (theme, fts = 20, color = theme === "dark" ? "white" : "black") => ({
    color: color,
    fontSize: fts,
    fontWeight: "bold",
  }),
  header: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    height: 50,
  },
  backButton: {
    marginHorizontal: 10,
  },
  buttons: {
    flexDirection: "row",
    marginTop: 20,
  },
  button: (disabled = false, theme = "dark") => ({
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: disabled
      ? "rgba(0,0,0,0)"
      : theme === "dark"
      ? "rgba(198,0,198,1)"
      : "rgba(0,255,0,0.8)",
    borderRadius: 20,
    opacity: disabled ? 0 : 1,
  }),
  status: (theme = "dark", rot = false) => ({
    marginVertical: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: theme === "dark" ? "white" : "black",
    transform: [{ rotate: rot ? "180deg" : "0deg" }],
  }),
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  isPage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 30,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
});

export default ChessJs;
