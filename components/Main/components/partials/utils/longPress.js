import React from "react";
import { TouchableWithoutFeedback } from "react-native";

const LongPressComponent = ({
  children,
  onLongPress,
  time = 500,
  style = { flex: 1 },
  onTap,
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

  const onTapped = () => {
    if (isPressed) {
      isPressed = false;
      onLongPress(false);
    }
    onTap(true);
  };

  return (
    <TouchableWithoutFeedback
      style={style}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onTap}
    >
      {children}
    </TouchableWithoutFeedback>
  );
};

export default LongPressComponent;
