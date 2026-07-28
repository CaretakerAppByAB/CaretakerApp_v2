import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@notification_preferences';

type NotificationPreferences = {
  notificationsEnabled: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  moodCheckIns: boolean;
  journalReminders: boolean;
  communityUpdates: boolean;
  privateMessages: boolean;
  weeklySummary: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  notificationsEnabled: true,
  medicationReminders: true,
  appointmentReminders: true,
  moodCheckIns: true,
  journalReminders: false,
  communityUpdates: false,
  privateMessages: true,
  weeklySummary: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

type PreferenceRowProps = {
  title: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
};

const PreferenceRow = ({
  title,
  description,
  value,
  disabled = false,
  onValueChange,
}: PreferenceRowProps) => {
  return (
    <View style={[styles.preferenceRow, disabled && styles.disabledRow]}>
      <View style={styles.preferenceTextContainer}>
        <Text style={[styles.preferenceTitle, disabled && styles.disabledText]}>
          {title}
        </Text>

        {description ? (
          <Text
            style={[
              styles.preferenceDescription,
              disabled && styles.disabledText,
            ]}>
            {description}
          </Text>
        ) : null}
      </View>

      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{
          false: '#CFCFCF',
          true: '#B8AEF5',
        }}
        thumbColor={value ? '#7567D8' : '#F4F4F4'}
      />
    </View>
  );
};

const NotificationPreferencesScreen = ({navigation}: any) => {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedPreferences) {
        const parsedPreferences =
          JSON.parse(savedPreferences) as Partial<NotificationPreferences>;

        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsedPreferences,
        });
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);

      Alert.alert(
        'Unable to load preferences',
        'Your default notification settings will be used.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => {
    setPreferences(previous => ({
      ...previous,
      [key]: value,
    }));
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(preferences),
      );

      Alert.alert(
        'Preferences saved',
        'Your notification preferences have been updated.',
      );
    } catch (error) {
      console.error('Failed to save notification preferences:', error);

      Alert.alert(
        'Unable to save',
        'Something went wrong while saving your preferences.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetPreferences = () => {
    Alert.alert(
      'Reset preferences',
      'Restore all notification preferences to their default values?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setPreferences(DEFAULT_PREFERENCES);

              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(DEFAULT_PREFERENCES),
              );
            } catch (error) {
              console.error('Failed to reset notification preferences:', error);
            }
          },
        },
      ],
    );
  };

  const notificationOptionsDisabled =
    !preferences.notificationsEnabled;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7567D8" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Choose which notifications you would like to receive.
        </Text>

        <View style={styles.section}>
          <PreferenceRow
            title="Allow Notifications"
            description="Turn all app notifications on or off."
            value={preferences.notificationsEnabled}
            onValueChange={value =>
              updatePreference('notificationsEnabled', value)
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Reminders</Text>

        <View style={styles.section}>
          <PreferenceRow
            title="Medication Reminders"
            description="Receive reminders when it is time to take medication."
            value={preferences.medicationReminders}
            disabled={notificationOptionsDisabled}
            onValueChange={value =>
              updatePreference('medicationReminders', value)
            }
          />

          <View style={styles.divider} />

          <PreferenceRow
            title="Appointment Reminders"
            description="Receive alerts before upcoming appointments."
            value={preferences.appointmentReminders}
            disabled={notificationOptionsDisabled}
            onValueChange={value =>
              updatePreference('appointmentReminders', value)
            }
          />

          <View style={styles.divider} />

          <PreferenceRow
            title="Mood Check-Ins"
            description="Receive reminders to record how you are feeling."
            value={preferences.moodCheckIns}
            disabled={notificationOptionsDisabled}
            onValueChange={value =>
              updatePreference('moodCheckIns', value)
            }
          />

          <View style={styles.divider} />

          <PreferenceRow
            title="Journal Reminders"
            description="Receive reminders to write in your journal."
            value={preferences.journalReminders}
            disabled={notificationOptionsDisabled}
            onValueChange={value =>
              updatePreference('journalReminders', value)
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Activity</Text>

        <View style={styles.section}>
          <PreferenceRow
            title="Community Updates"
            description="Receive updates about community activity."
            value={preferences.communityUpdates}
            disabled={notificationOptionsDisabled}
            onValueChange={value =>
              updatePreference('communityUpdates', value)
            }
          />

          <View style={styles.divider} />

          <PreferenceRow
            title="Private Messages"
            description="Receive alerts when someone sends you a message."
            value={preferences.privateMessages}
            disabled={notificationOptionsDisabled}
            onValueChange={value =>
              updatePreference('privateMessages', value)
            }
          />

          <View style={styles.divider} />

          <PreferenceRow
            title="Weekly Summary"
            description="Receive a weekly summary of mood and journal activity."
            value={preferences.weeklySummary}
            disabled={notificationOptionsDisabled}
            onValueChange={value =>
              updatePreference('weeklySummary', value)
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Alert Style</Text>

        <View style={styles.section}>
          <PreferenceRow
            title="Sound"
            description="Play a sound when a notification arrives."
            value={preferences.soundEnabled}
            disabled={notificationOptionsDisabled}
            onValueChange={value =>
              updatePreference('soundEnabled', value)
            }
          />

          <View style={styles.divider} />

          <PreferenceRow
            title="Vibration"
            description="Vibrate when a notification arrives."
            value={preferences.vibrationEnabled}
            disabled={notificationOptionsDisabled}
            onValueChange={value =>
              updatePreference('vibrationEnabled', value)
            }
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            isSaving && styles.saveButtonDisabled,
          ]}
          disabled={isSaving}
          onPress={savePreferences}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetPreferences}>
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666666',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8B7EEE',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '300',
    lineHeight: 40,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#666666',
    marginBottom: 18,
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#7567D8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  preferenceRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  disabledRow: {
    opacity: 0.45,
  },
  preferenceTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202020',
  },
  preferenceDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#777777',
  },
  disabledText: {
    color: '#999999',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E3E3E3',
  },
  saveButton: {
    height: 52,
    marginTop: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7567D8',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    height: 48,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#D16D6D',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default NotificationPreferencesScreen;
