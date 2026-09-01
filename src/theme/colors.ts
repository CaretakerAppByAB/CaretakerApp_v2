// AlzApp Color Palette — Lavender/Purple Theme
// Matched to the provided mockup wireframe

export const Colors = {
  // Core brand
  primary: '#8B7EEE',       // Main lavender-purple (buttons, accents)
  primaryLight: '#EDE9FF',  // Soft lavender (backgrounds, chips)
  primaryMedium: '#A89FF0', // Mid-tone purple (hover states)
  primaryDark: '#6A5DD4',   // Deep purple (pressed states)

  // Backgrounds
  background: '#FFFFFF',
  backgroundLight: '#F5F3FF', // Very soft lavender page background

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
