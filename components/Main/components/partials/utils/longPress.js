import React from "react";
import { TouchableWithoutFeedback } from "react-native";

const LongPressComponent = ({
  children,
  onLongPress,
  time = 500,
  style = { flex: 1 },
}) => {
  let isPressed = false;

  const onPressIn = () => {
    isPressed = true;
    pressed();
  };

  const pressed = () => {
    setTimeout(() => {
      if (isPressed) {
        onLongPress(true);
      }
    }, time);
  };

  const onPressOut = () => {
    isPressed = false;
    onLongPress(false);
  };

  return (
    <TouchableWithoutFeedback
      style={style}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      {children}
    </TouchableWithoutFeedback>
  );
};

export default LongPressComponent;
