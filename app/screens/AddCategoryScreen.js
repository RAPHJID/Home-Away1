import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native'
import { supabase } from '../lib/supabase'

const ICONS = ['🍔', '🏠', '🚗', '💊', '📱', '👕', '✈️', '🎮', '📚', '💇', '🐶', '⚽', '🎵', '💼', '🛒', '💡', '🏋️', '🍺', '☕', '💰', '💸', '🏦', '🎁', '🔧', '🧾']

const COLORS = [
  '#E24B4A', '#1D9E75', '#185FA5', '#EF9F27',
  '#7F77DD', '#D85A30', '#0F6E56', '#D4537E',
  '#639922', '#854F0B', '#378ADD', '#888780'
]

export default function AddCategoryScreen({ navigation, route }) {
  const categoryType = route?.params?.type || 'expense'
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('💰')
  const [selectedColor, setSelectedColor] = useState('#185FA5')
  const [type, setType] = useState(categoryType)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('categories').insert({
      user_id: user.id,
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type,
      is_default: false
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success', 'Category created!')
      navigation.goBack()
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New category</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={styles.label}>Category type</Text>
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'both' && styles.typeBtnBoth]}
            onPress={() => setType('both')}
          >
            <Text style={[styles.typeText, type === 'both' && styles.typeTextActive]}>
              Both
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Category name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Gym membership"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.previewRow}>
          <View style={[styles.preview, { backgroundColor: selectedColor + '22' }]}>
            <Text style={styles.previewIcon}>{selectedIcon}</Text>
          </View>
          <Text style={[styles.previewName, { color: selectedColor }]}>
            {name || 'Category name'}
          </Text>
        </View>

        <Text style={styles.label}>Choose icon</Text>
        <View style={styles.iconGrid}>
          {ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconBtn,
                selectedIcon === icon && { borderColor: selectedColor, borderWidth: 2 }
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Choose color</Text>
        <View style={styles.colorGrid}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorBtn,
                { backgroundColor: color },
                selectedColor === color && styles.colorBtnActive
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Text style={styles.colorCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Create category</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  inner: { padding: 20, paddingTop: 60 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24
  },
  backBtn: { fontSize: 15, color: '#185FA5' },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  typeToggle: {
    flexDirection: 'row', backgroundColor: '#e8e8e8',
    borderRadius: 10, padding: 4, marginBottom: 24
  },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  typeBtnExpense: { backgroundColor: '#E24B4A' },
  typeBtnIncome: { backgroundColor: '#1D9E75' },
  typeBtnBoth: { backgroundColor: '#185FA5' },
  typeText: { fontSize: 13, fontWeight: '500', color: '#666' },
  typeTextActive: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '500', color: '#444', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    fontSize: 15, color: '#1a1a1a', marginBottom: 16,
    borderWidth: 0.5, borderColor: '#ddd'
  },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 20, borderWidth: 0.5, borderColor: '#eee'
  },
  preview: {
    width: 44, height: 44, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center'
  },
  previewIcon: { fontSize: 22 },
  previewName: { fontSize: 16, fontWeight: '500' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  iconBtn: {
    width: 48, height: 48, borderRadius: 10,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 0.5, borderColor: '#ddd'
  },
  iconText: { fontSize: 22 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  colorBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center'
  },
  colorBtnActive: { borderWidth: 3, borderColor: '#fff', opacity: 0.9 },
  colorCheck: { fontSize: 16, color: '#fff', fontWeight: '700' },
  saveBtn: {
    backgroundColor: '#185FA5', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
})