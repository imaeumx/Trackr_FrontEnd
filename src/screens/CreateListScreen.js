// src/screens/CreateListScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { globalStyles, colors } from '../styles/globalStyles';

const CreateListScreen = ({ navigation }) => {
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');

  const handleCreateList = () => {
    if (!listName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    // Mock API call to create list
    Alert.alert('Success', `List "${listName}" created!`);
    navigation.goBack();
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create New List</Text>
          
          <Text style={styles.label}>List Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter list name"
            placeholderTextColor={colors.textSecondary}
            value={listName}
            onChangeText={setListName}
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter list description"
            placeholderTextColor={colors.textSecondary}
            value={listDescription}
            onChangeText={setListDescription}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.createButton} onPress={handleCreateList}>
            <Text style={styles.createButtonText}>Create List</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = {
  formContainer: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: colors.text,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
};

export default CreateListScreen;
