import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../theme/colors';

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

interface AvatarProps {
  name: string;
  size?: number;
  /** 'onLight' = purple initials on a light-purple circle (default screen body).
   *  'onDark'  = white initials on a translucent-white circle (sits on a purple bar/hero). */
  variant?: 'onLight' | 'onDark';
}

const Avatar: React.FC<AvatarProps> = ({name, size = 44, variant = 'onLight'}) => {
  const onDark = variant === 'onDark';
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: onDark ? Colors.overlayButton : Colors.primary200,
        },
      ]}>
      <Text
        style={[
          styles.initials,
          {
            fontSize: size * 0.36,
            color: onDark ? Colors.white : Colors.primaryDark,
          },
        ]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});

export default Avatar;
