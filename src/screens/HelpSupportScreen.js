// src/screens/HelpSupportScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';

const HelpSupportScreen = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I create a playlist?',
      answer: 'Navigate to the Playlists tab and tap the "+" button. Enter a name and description for your playlist, then start adding movies and series from the detail pages.'
    },
    {
      id: 2,
      question: 'How do I add movies to my playlist?',
      answer: 'Open any movie or series detail page and tap the "Add to List" button. Select the playlist you want to add it to from the list.'
    },
    {
      id: 3,
      question: 'Can I use TrackR without signing in?',
      answer: 'Yes! You can browse movies and series as a guest. However, you need to sign in to create playlists, add items to lists, and save your preferences.'
    },
    {
      id: 4,
      question: 'Where does the movie data come from?',
      answer: 'TrackR uses The Movie Database (TMDB) API to provide comprehensive information about movies and TV series, including posters, descriptions, ratings, and more.'
    },
    {
      id: 5,
      question: 'How do I track my watch progress?',
      answer: 'On each movie/series detail page, you can mark items as "Watched", "Watching", or "To Watch" using the status buttons.'
    },
    {
      id: 6,
      question: 'Can I search for specific movies or series?',
      answer: 'Yes! Use the search bar at the top of any screen to search for movies and TV series by title.'
    }
  ];

  const contactMethods = [
    {
      id: 1,
      title: 'Email Support',
      subtitle: 'support@trackr.app',
      icon: 'mail',
      action: () => {
        Linking.openURL('mailto:support@trackr.app?subject=TrackR Support Request');
      }
    },
    {
      id: 2,
      title: 'Report a Bug',
      subtitle: 'Help us improve',
      icon: 'bug',
      action: () => {
        Alert.alert(
          'Report a Bug',
          'Please email us at bugs@trackr.app with:\n\n' +
          '• Description of the issue\n' +
          '• Steps to reproduce\n' +
          '• Screenshots (if possible)\n\n' +
          'Thank you for helping us improve TrackR!'
        );
      }
    },
    {
      id: 3,
      title: 'Feature Request',
      subtitle: 'Suggest new features',
      icon: 'bulb',
      action: () => {
        Alert.alert(
          'Feature Request',
          'We love hearing your ideas! Send your feature suggestions to:\n\nfeatures@trackr.app\n\n' +
          'Include:\n' +
          '• Feature description\n' +
          '• Why it would be useful\n' +
          '• Any examples or mockups'
        );
      }
    },
    {
      id: 4,
      title: 'Visit Our Website',
      subtitle: 'www.trackr.app',
      icon: 'globe',
      action: () => {
        Linking.openURL('https://www.trackr.app');
      }
    }
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Introduction */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle" size={48} color={colors.primary} style={styles.sectionIcon} />
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>We're here to help!</Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
            Find answers to common questions below or reach out to our support team.
          </Text>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Frequently Asked Questions
          </Text>
          {faqs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={[styles.faqItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
              onPress={() => toggleFAQ(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  {faq.question}
                </Text>
                <Ionicons
                  name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              {expandedFAQ === faq.id && (
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                  {faq.answer}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Methods */}
        <View style={styles.contactSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Get in Touch
          </Text>
          {contactMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.contactItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
              onPress={method.action}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                <Ionicons name={method.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactTitle, { color: colors.text }]}>{method.title}</Text>
                <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
                  {method.subtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={[styles.appInfo, { backgroundColor: colors.card }]}>
          <Text style={[styles.appInfoTitle, { color: colors.text }]}>TrackR</Text>
          <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>
            © 2025 TrackR. All rights reserved.
          </Text>
          <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>
            Movie data provided by TMDB
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  sectionIcon: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  faqSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  faqItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
  },
  contactSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
  },
  appInfo: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  appInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appInfoText: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default HelpSupportScreen;
