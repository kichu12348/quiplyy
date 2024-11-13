import { View } from "react-native";
import { icons } from "lucide-react-native";
import { useTheme } from "../../../../../contexts/theme";

const Icon = ({
  name = "settings",
  size = 24,
  color = null,
  style = { alignSelf: "center" },
}) => {
  const { theme } = useTheme();

  const Icon = icons[name];
  const defColor = color ? color : theme === "dark" ? "#fff" : "#000";

  return (
    <View style={style}>
      <Icon size={size} color={defColor} />
    </View>
  );
};

export default Icon;
