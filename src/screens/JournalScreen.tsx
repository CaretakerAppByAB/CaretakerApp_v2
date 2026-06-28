import React from 'react';
import UnderDevelopment from '../components/UnderDevelopment';

/**
 * DEVELOPER NOTE:
 * This screen is assigned for Journal implementation.
 * Replace the <UnderDevelopment /> component with the full feature.
 * Key integration: journal entries will feed keywords into the Resource Library
 * recommendation engine via a keyword → tag mapping system.
 */
const JournalScreen = () => (
  <UnderDevelopment
    emoji="📓"
    featureName="Journal"
    description="A private, secure space to write about your day and process your experiences. Journal entries will later power personalised resource recommendations."
  />
);

export default JournalScreen;
