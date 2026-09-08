// AlzApp Color Palette — Lavender/Purple Theme
// Updated to the darker primary-700 accent + white backgrounds from the latest Figma export

export const Colors = {
  // Core brand
  primary: '#1F102B',       // Deep purple — main accent (buttons, active states, badges)
  primaryLight: '#EFE9F6',  // Soft lavender (chips, input fills)
  primaryMedium: '#9462BD', // Mid-tone violet (hover / secondary accents)
  primaryDark: '#150B1F',   // Near-black purple (pressed states)

  // Figma purple scale (kept alongside the semantic names above for 1:1 handoff mapping)
  primary100: '#EFE9F6',
  primary200: '#CFBCE3',
  primary400: '#9462BD',
  primary600: '#432859',
  primary700: '#1F102B',

  // Backgrounds
  background: '#FFFFFF',
  backgroundLight: '#FFFFFF', // Pages are plain white now — no more lavender page tint

  // Text
  text: '#1E1B3A',           // Almost-black indigo for readability
  textSecondary: '#6B68A0',  // Muted purple-grey

  // UI
  white: '#FFFFFF',
  border: '#DDD9FF',
  cardBackground: '#F0EEFF',

  // Header buttons / controls sitting on a purple bar
  overlayButton: 'rgba(255,255,255,0.2)',
  overlayLight: 'rgba(255,255,255,0.85)',

  // Bottom tab bar
  tabInactive: '#9E9E9E',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Mood palette (for mood tracking)
  moodColors: [
    '#EF4444', // 0 - Very Sad (red)
    '#F97316', // 1 - Sad (orange)
    '#EAB308', // 2 - Neutral (yellow)
    '#22C55E', // 3 - Happy (green)
    '#10B981', // 4 - Very Happy (teal-green)
  ],
};
