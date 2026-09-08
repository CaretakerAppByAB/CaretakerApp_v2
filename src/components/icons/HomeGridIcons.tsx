/**
 * HomeGridIcons.tsx — icon set used only by the Home screen's 3×2 feature grid.
 * Kept separate from TabIcons.tsx so updating these doesn't also change the
 * bottom tab bar icons, which reuse the same names (Journal, Community, etc.)
 */

import React from 'react';
import {Image} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {Colors} from '../../theme/colors';

interface IconProps {
  color?: string;
  size?: number;
}

// Hands cradling a heart — supplied as a raster asset, not a vector, so `color` is ignored.
export const SupportGridIcon = ({size = 24}: IconProps) => (
  <Image
    source={require('../../../images/icon-support-hands.png')}
    style={{width: size, height: size}}
    resizeMode="contain"
  />
);

// Open book — 52×42 source viewBox
export const JournalGridIcon = ({color = Colors.primary, size = 24}: IconProps) => (
  <Svg width={size} height={size * (42 / 52)} viewBox="0 0 52 42" fill="none">
    <Path d="M26 12.25V36.75" stroke={color} strokeWidth={1.83257} strokeLinecap="round" strokeLinejoin="round"/>
    <Path
      d="M6.49998 31.5C5.92534 31.5 5.37424 31.3156 4.96791 30.9874C4.56159 30.6592 4.33331 30.2141 4.33331 29.75V7C4.33331 6.53587 4.56159 6.09075 4.96791 5.76256C5.37424 5.43437 5.92534 5.25 6.49998 5.25H17.3333C19.6319 5.25 21.8363 5.9875 23.4616 7.30025C25.0869 8.61301 26 10.3935 26 12.25C26 10.3935 26.9131 8.61301 28.5384 7.30025C30.1637 5.9875 32.3681 5.25 34.6666 5.25H45.5C46.0746 5.25 46.6257 5.43437 47.032 5.76256C47.4384 6.09075 47.6666 6.53587 47.6666 7V29.75C47.6666 30.2141 47.4384 30.6592 47.032 30.9874C46.6257 31.3156 46.0746 31.5 45.5 31.5H32.5C30.7761 31.5 29.1228 32.0531 27.9038 33.0377C26.6848 34.0223 26 35.3576 26 36.75C26 35.3576 25.3152 34.0223 24.0962 33.0377C22.8772 32.0531 21.2239 31.5 19.5 31.5H6.49998Z"
      stroke={color} strokeWidth={1.83257} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

// Speech bubble — 52×47 source viewBox
export const CommunityGridIcon = ({color = Colors.primary, size = 24}: IconProps) => (
  <Svg width={size} height={size * (47 / 52)} viewBox="0 0 52 47" fill="none">
    <Path
      d="M17.1167 39.1667C21.252 41.084 26.0089 41.6033 30.5303 40.6311C35.0517 39.6588 39.0402 37.2589 41.7772 33.8639C44.5141 30.4688 45.8194 26.3018 45.458 22.1138C45.0965 17.9258 43.092 13.9922 39.8056 11.0219C36.5193 8.05153 32.1672 6.23975 27.5337 5.91303C22.9002 5.58632 18.2899 6.76614 14.5337 9.23991C10.7774 11.7137 8.12221 15.3187 7.04652 19.4054C5.97084 23.492 6.54542 27.7915 8.66671 31.5292L4.33337 43.0833L17.1167 39.1667Z"
      stroke={color} strokeWidth={1.83257} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

// Heart outline — 46×43 source viewBox
export const GratitudeGridIcon = ({color = Colors.primary, size = 24}: IconProps) => (
  <Svg width={size} height={size * (43 / 46)} viewBox="0 0 46 43" fill="none">
    <Path
      d="M36.4166 25.0833C39.2725 22.4675 42.1666 19.3321 42.1666 15.2292C42.1666 12.6157 41.056 10.1092 39.0791 8.26122C37.1021 6.4132 34.4208 5.375 31.625 5.375C28.2516 5.375 25.875 6.27083 23 8.95833C20.125 6.27083 17.7483 5.375 14.375 5.375C11.5792 5.375 8.89784 6.4132 6.9209 8.26122C4.94395 10.1092 3.83331 12.6157 3.83331 15.2292C3.83331 19.35 6.70831 22.4854 9.58331 25.0833L23 37.625L36.4166 25.0833Z"
      stroke={color} strokeWidth={1.83257} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

// Envelope — 44×43 source viewBox
export const MessagesGridIcon = ({color = Colors.primary, size = 24}: IconProps) => (
  <Svg width={size} height={size * (43 / 44)} viewBox="0 0 44 43" fill="none">
    <Path
      d="M38.5 26.875C38.5 27.8254 38.1137 28.7368 37.4261 29.4088C36.7384 30.0808 35.8058 30.4583 34.8333 30.4583H12.8333L5.5 37.625V8.95833C5.5 8.00797 5.88631 7.09654 6.57394 6.42453C7.26157 5.75253 8.19421 5.375 9.16667 5.375H34.8333C35.8058 5.375 36.7384 5.75253 37.4261 6.42453C38.1137 7.09654 38.5 8.00797 38.5 8.95833V26.875Z"
      stroke={color} strokeWidth={1.83257} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);
