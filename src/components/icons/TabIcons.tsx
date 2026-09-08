/**
 * TabIcons.tsx
 * Place this file at: src/components/icons/TabIcons.tsx
 *
 * All icons accept a `color` prop so they can be styled
 * as active (black) or inactive (gray) in the tab bar.
 * Grid tile icons use color="#FFFFFF" (white on gray tiles).
 */

import React from 'react';
import Svg, {Path, Rect} from 'react-native-svg';
import {Colors} from '../../theme/colors';

interface IconProps {
  color?: string;
  size?: number;
}

// ── Home (house) ───────────────────────────────────────────────────────────────
// Drawn to match the stroke style of the other Figma icons.

export const HomeIcon = ({color = '#000000', size = 24}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 52 47" fill="none">
    <Path
      d="M8 22L26 5L44 22V42H32V30H20V42H8V22Z"
      stroke={color}
      strokeWidth={1.83}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Journal (open book) ────────────────────────────────────────────────────────
// Source: Icon.svg

export const JournalIcon = ({color = '#000000', size = 24}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 52 42" fill="none">
    <Path
      d="M26 12.25V36.75"
      stroke={color}
      strokeWidth={1.83}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.5 31.5C5.925 31.5 5.374 31.316 4.968 30.987C4.562 30.659 4.333 30.214 4.333 29.75V7C4.333 6.536 4.562 6.091 4.968 5.763C5.374 5.434 5.925 5.25 6.5 5.25H17.333C19.632 5.25 21.836 5.988 23.462 7.3C25.087 8.613 26 10.394 26 12.25C26 10.394 26.913 8.613 28.538 7.3C30.164 5.988 32.368 5.25 34.667 5.25H45.5C46.075 5.25 46.626 5.434 47.032 5.763C47.438 6.091 47.667 6.536 47.667 7V29.75C47.667 30.214 47.438 30.659 47.032 30.987C46.626 31.316 46.075 31.5 45.5 31.5H32.5C30.776 31.5 29.123 32.053 27.904 33.038C26.685 34.022 26 35.358 26 36.75C26 35.358 25.315 34.022 24.096 33.038C22.877 32.053 21.224 31.5 19.5 31.5H6.5Z"
      stroke={color}
      strokeWidth={1.83}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Community (chat bubble) ────────────────────────────────────────────────────
// Source: Icon-2.svg

export const CommunityIcon = ({color = '#000000', size = 24}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 44 43" fill="none">
    <Path
      d="M38.5 26.875C38.5 27.825 38.114 28.737 37.426 29.409C36.738 30.081 35.806 30.458 34.833 30.458H12.833L5.5 37.625V8.958C5.5 8.008 5.886 7.097 6.574 6.425C7.262 5.753 8.194 5.375 9.167 5.375H34.833C35.806 5.375 36.738 5.753 37.426 6.425C38.114 7.097 38.5 8.008 38.5 8.958V26.875Z"
      stroke={color}
      strokeWidth={1.83}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Support (heart) ────────────────────────────────────────────────────────────
// Source: Icon-3.svg

export const SupportIcon = ({color = '#000000', size = 24}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 46 43" fill="none">
    <Path
      d="M36.417 25.083C39.273 22.468 42.167 19.332 42.167 15.229C42.167 12.616 41.056 10.109 39.079 8.261C37.102 6.413 34.421 5.375 31.625 5.375C28.252 5.375 25.875 6.271 23 8.958C20.125 6.271 17.748 5.375 14.375 5.375C11.579 5.375 8.898 6.413 6.921 8.261C4.944 10.109 3.833 12.616 3.833 15.229C3.833 19.35 6.708 22.485 9.583 25.083L23 37.625L36.417 25.083Z"
      stroke={color}
      strokeWidth={1.83}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Messages (speech bubble with ellipsis) ─────────────────────────────────────
// Source: Icon-4.svg

export const MessagesIcon = ({color = '#000000', size = 24}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 52 47" fill="none">
    <Path
      d="M17.117 39.167C21.252 41.084 26.009 41.603 30.53 40.631C35.052 39.659 39.04 37.259 41.777 33.864C44.514 30.469 45.819 26.302 45.458 22.114C45.096 17.926 43.092 13.992 39.806 11.022C36.519 8.052 32.167 6.24 27.534 5.913C22.9 5.586 18.29 6.766 14.534 9.24C10.777 11.714 8.122 15.319 7.046 19.405C5.971 23.492 6.545 27.792 8.667 31.529L4.333 43.083L17.117 39.167Z"
      stroke={color}
      strokeWidth={1.83}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Mood Chart (bar chart) — used in Home grid tile ───────────────────────────
// Source: Vector.svg  (uses fill, not stroke)

export const MoodChartIcon = ({color = '#FFFFFF', size = 44}: IconProps) => (
  <Svg width={size} height={size * 0.82} viewBox="0 0 50 41" fill="none">
    <Path
      d="M0 38.95C0 38.406 0.239 37.885 0.666 37.5C1.092 37.116 1.67 36.9 2.273 36.9H47.727C48.33 36.9 48.908 37.116 49.334 37.5C49.761 37.885 50 38.406 50 38.95C50 39.494 49.761 40.015 49.334 40.4C48.908 40.784 48.33 41 47.727 41H2.273C1.67 41 1.092 40.784 0.666 40.4C0.239 40.015 0 39.494 0 38.95ZM43.182 12.3C43.785 12.3 44.363 12.516 44.789 12.9C45.215 13.285 45.455 13.806 45.455 14.35V30.75C45.455 31.294 45.215 31.815 44.789 32.2C44.363 32.584 43.785 32.8 43.182 32.8H29.545C28.943 32.8 28.365 32.584 27.938 32.2C27.512 31.815 27.273 31.294 27.273 30.75V14.35C27.273 13.806 27.512 13.285 27.938 12.9C28.365 12.516 28.943 12.3 29.545 12.3H43.182ZM40.909 16.4H31.818V28.7H40.909V16.4ZM20.455 0C21.057 0 21.635 0.216 22.062 0.6C22.488 0.985 22.727 1.506 22.727 2.05V30.75C22.727 31.294 22.488 31.815 22.062 32.2C21.635 32.584 21.057 32.8 20.455 32.8H6.818C6.215 32.8 5.637 32.584 5.211 32.2C4.785 31.815 4.545 31.294 4.545 30.75V2.05C4.545 1.506 4.785 0.985 5.211 0.6C5.637 0.216 6.215 0 6.818 0H20.455ZM18.182 4.1H9.091V28.7H18.182V4.1Z"
      fill={color}
    />
  </Svg>
);

// ── Envelope Open — used by ThankYouNoteScreen, ChatScreen, ThankYouNoteOverlay ──
// Exported here so no screen needs to import from another screen.

export const EnvelopeOpenIcon = ({size = 40, color = Colors.primary}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    {/* Envelope body */}
    <Path
      d="M6 20L24 8L42 20V40C42 41.1 41.1 42 40 42H8C6.9 42 6 41.1 6 40V20Z"
      stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
    />
    {/* Open flap */}
    <Path d="M6 20L24 30L42 20" stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
  </Svg>
);

// ── Calendar — used for the Mood Calendar dashboard tile ───────────────────────

export const CalendarIcon = ({color = '#000000', size = 24}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3.5} y={5} width={17} height={15} rx={2.5} stroke={color} strokeWidth={1.3}/>
    <Path d="M3.5 10h17" stroke={color} strokeWidth={1.3} strokeLinecap="round"/>
    <Path d="M8 2.5v5" stroke={color} strokeWidth={1.3} strokeLinecap="round"/>
    <Path d="M16 2.5v5" stroke={color} strokeWidth={1.3} strokeLinecap="round"/>
  </Svg>
);

// ── Gratitude (hands cradling a heart) — used for the Gratitude dashboard tile ─

export const GratitudeIcon = ({color = '#000000', size = 24}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 12.8c-.9-.8-3.4-2.8-3.4-4.8a2.3 2.3 0 014.2-1.3 2.3 2.3 0 014.2 1.3c0 2-2.5 4-3.4 4.8l-.8.7-.8-.7z"
      stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round"
    />
    <Path
      d="M2.5 14.5c0-1.6.9-3 2.3-3.7 1-.5 1.9 0 2.6.8"
      stroke={color} strokeWidth={1.6} strokeLinecap="round"
    />
    <Path
      d="M2.5 14.5c0 3.4 3 5.6 9.5 7.5"
      stroke={color} strokeWidth={1.6} strokeLinecap="round"
    />
    <Path
      d="M21.5 14.5c0-1.6-.9-3-2.3-3.7-1-.5-1.9 0-2.6.8"
      stroke={color} strokeWidth={1.6} strokeLinecap="round"
    />
    <Path
      d="M21.5 14.5c0 3.4-3 5.6-9.5 7.5"
      stroke={color} strokeWidth={1.6} strokeLinecap="round"
    />
  </Svg>
);

// ── Message bubble (simple, with tail) — used for the Messages dashboard tile ──

export const MessageBubbleIcon = ({color = '#000000', size = 24}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4.5} width={18} height={12} rx={4} stroke={color} strokeWidth={1.7}/>
    <Path d="M8 16.5v3.8l4.2-3.8" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
