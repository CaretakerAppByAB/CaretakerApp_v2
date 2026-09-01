import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, StatusBar} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import {Colors} from '../theme/colors';

const BackChevron: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={Colors.white}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  /** Overrides the default title/subtitle text block (e.g. avatar + name). */
  titleSlot?: React.ReactNode;
}

const SIDE_SLOT = 36;

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightElement,
  titleSlot,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={[styles.bar, {paddingTop: insets.top + 12}]}>
        <View style={styles.row}>
          <View style={styles.side}>
            {onBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <BackChevron />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.center}>
            {titleSlot ?? (
              <>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {!!subtitle && (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </>
            )}
          </View>

          <View style={[styles.side, styles.sideRight]}>{rightElement}</View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.primary,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: SIDE_SLOT,
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  backBtn: {
    width: SIDE_SLOT,
    height: SIDE_SLOT,
    borderRadius: SIDE_SLOT / 2,
    backgroundColor: Colors.overlayButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.overlayLight,
    marginTop: 2,
  },
});

export default ScreenHeader;
