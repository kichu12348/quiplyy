import { SafeAreaView as SAVSafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../../../../../contexts/theme';

const SafeAreaView = ({ children, backgroundColor }) => {
  const theme = useTheme();

  return (
    <>
      {Platform.OS === 'android' ? (
        <SAVSafeAreaView style={styles.container(theme, backgroundColor)}>
          {children}
        </SAVSafeAreaView>
      ) : (
        <View style={styles.container(theme, backgroundColor)}>
          {children}
        </View>
      )}
    </>
  );
};

export default SafeAreaView;

const styles = StyleSheet.create({
  container: (theme, backgroundColor) => ({
    flex: 1,
    backgroundColor: backgroundColor ? backgroundColor : theme.background,
  }),
});
