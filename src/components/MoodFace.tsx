import React from 'react';
import Svg, {Circle, Path, G} from 'react-native-svg';
import {MoodType} from '../services/moodService';

const MoodFace: React.FC<{mood: MoodType; size?: number}> = ({mood, size = 48}) => {
  const F = '#FCEA2B';
  const S = '#333333';

  const happyEyes = () => (
    <G>
      <Path d="M11,16 Q14.5,11 18,16" stroke={S} strokeWidth={2} strokeLinecap="round" fill="none"/>
      <Path d="M22,16 Q25.5,11 29,16" stroke={S} strokeWidth={2} strokeLinecap="round" fill="none"/>
    </G>
  );
  const dotEyes = (cy = 15, r = 2.5) => (
    <G>
      <Circle cx={14} cy={cy} r={r} fill={S}/>
      <Circle cx={26} cy={cy} r={r} fill={S}/>
    </G>
  );
  const worriedBrows = () => (
    <G>
      <Path d="M11,13 L18,10" stroke={S} strokeWidth={2} strokeLinecap="round"/>
      <Path d="M29,13 L22,10" stroke={S} strokeWidth={2} strokeLinecap="round"/>
    </G>
  );

  const eyes: Record<MoodType, React.ReactNode> = {
    VeryHappy: happyEyes(),
    Happy:     happyEyes(),
    Neutral:   dotEyes(15, 2.5),
    Sad:       dotEyes(16, 2.2),
    VerySad:   <G>{worriedBrows()}{dotEyes(17, 2)}</G>,
  };

  const mouth: Record<MoodType, string> = {
    VeryHappy: 'M10,24 Q20,33 30,24',
    Happy:     'M13,25 Q20,30 27,25',
    Neutral:   'M13,24 L27,24',
    Sad:       'M11,27 Q20,20 29,27',
    VerySad:   'M10,29 Q20,18 30,29',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={18} fill={F} stroke={S} strokeWidth={1}/>
      {eyes[mood]}
      <Path d={mouth[mood]} stroke={S} strokeWidth={1.8} strokeLinecap="round" fill="none"/>
    </Svg>
  );
};

export default MoodFace;
