import React from 'react';
import UnderDevelopment from '../components/UnderDevelopment';

/**
 * DEVELOPER NOTE:
 * This screen is assigned for Anonymous Thank You Notes implementation.
 * Replace the <UnderDevelopment /> component with the full feature.
 * Key behaviour: sender is anonymous; recipient sees the note with no author info.
 * Possible flow: compose note → select recipient (by role/department) → send.
 */
const ThankYouScreen = () => (
  <UnderDevelopment
    emoji="💌"
    featureName="Anonymous Thank You Notes"
    description="Send heartfelt, anonymous notes of appreciation to colleagues. A small gesture that can make a huge difference on a hard shift."
  />
);

export default ThankYouScreen;
