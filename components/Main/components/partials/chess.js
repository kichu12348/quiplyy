import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import SafeAreaView from "./utils/safe";
import { useTheme } from "../../../../contexts/theme";
import { useSocket } from "../../../../contexts/socketContext";
import { Chess } from "chess.js";
import Chessboard from "react-native-chessboard";

const ChessJs = ({ navigation }) => {
  const { theme, Icons } = useTheme();
  const { socket } = useSocket();
  const chessboardRef = useRef(null);

  const [game, setGame] = useState(() => new Chess());
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [playerColor, setPlayerColor] = useState("w");
  const [isWhiteCheck, setIsWhiteCheck] = useState(false);
  const [isBlackCheck, setIsBlackCheck] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [isDraw, setIsDraw] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (isMultiplayer) {
      socket?.on("move", async (move) => {
        await handleMove(move.from, move.to);
      });

      socket.on("playerColor", (color) => {
        setPlayerColor(color);
      });

      return () => {
        socket?.off("move");
        socket?.off("playerColor");
      };
    }
  }, [isMultiplayer, socket]);

  const handleMove = async ({ move, state }) => {
    try {
      const { in_checkmate, in_draw, in_check } = state;
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
          setTimeout(() => {
            setIsWhiteCheck(false);
          }, 3000);
        } else {
          setIsWhiteCheck(true);
          setTimeout(() => {
            setIsWhiteCheck(false);
          }, 3000);
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

  const makeAIMove = async () => {
    const moves = game.moves();
    console.log("Moves:", moves);
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      await handleMove(randomMove.slice(0, 2), randomMove.slice(2, 4));
    }
  };

  const startMultiplayerGame = useCallback(() => {
    socket?.emit("joinGame");
    socket?.on("playerColor", (color) => {
      setPlayerColor(color);
    });
    setIsMultiplayer(true);
  }, [socket]);

  const resetGame = useCallback(() => {
    setIsBlackCheck(false);
    setIsWhiteCheck(false);
    setIsCheckmate(false);
    setIsDraw(false);
    setWinner(null);
    chessboardRef.current?.resetBoard();
    setGame(new Chess());
  }, []);

  return (
    <SafeAreaView>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image source={Icons.return} style={styles.backIcon} />
        </TouchableOpacity>
        <Image source={Icons.chess} style={styles.backIcon} />
      </View>
      <View style={styles.body}>
        <Text style={styles.status(theme, true)}>
          {" "}
          {isBlackCheck ? "Check!" : null}
        </Text>
        <Chessboard
          ref={chessboardRef}
          fen={game.fen()}
          playerColor={playerColor}
          onMove={handleMove}
        />
        <View style={styles.buttons}>
          {/* <TouchableOpacity
            style={styles.button(true)}
            onPress={() => setIsMultiplayer(false)}
            disabled={true}
          >
            <Text style={styles.textStyles(theme, 16)}>Play AI</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={styles.button(false, theme)}
            onPress={resetGame}
          >
            <Text style={styles.textStyles(theme, 16, "white")}>
              Reset Game
            </Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.button(true)}
            onPress={startMultiplayerGame}
            disabled={true}
          >
            <Text style={styles.textStyles(theme, 16)}>Play Multiplayer</Text>
          </TouchableOpacity> */}
        </View>
        <Text style={styles.status(theme)}>
          {" "}
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
            {winner ? winner + " wins" : "it's a Draw!!!"}
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
  textStyles: (
    theme,
    fts = 20,
    color = theme === "dark" ? "white" : "black"
  ) => ({
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
  backIcon: {
    width: 40,
    height: 40,
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
