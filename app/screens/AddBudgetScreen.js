import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function AddBudgetScreen({ navigation }) {
  const [categories, setCategories] = useState([])
  const [budgetGroups, setBudgetGroups] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [amountLimit, setAmountLimit] = useState('')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .or('type.eq.expense,type.eq.both')
      .order('name')

    const { data: groupData } = await supabase
      .from('budget_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')

    setProfile(profileData)
    setCategories(catData || [])
    setBudgetGroups(groupData || [])
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()

    const colors = ['#185FA5', '#1D9E75', '#D4537E', '#EF9F27']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const { data, error } = await supabase
      .from('budget_groups')
      .insert({ user_id: user.id, name: newGroupName.trim(), color: randomColor })
      .select()
      .single()

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setBudgetGroups([...budgetGroups, data])
      setSelectedGroup(data)
      setNewGroupName('')
      setShowNewGroup(false)
    }
  }

  async function handleSave() {
    if (!selectedCategory || !amountLimit) {
      Alert.alert('Error', 'Please select a category and enter a limit')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { error } = await supabase.from('budgets').insert({
      user_id: user.id,
      category_id: selectedCategory.id,
      budget_group_id: selectedGroup?.id || null,
      amount_limit: parseFloat(amountLimit),
      currency: profile?.work_currency || 'QAR',
      month: currentMonth,
      year: currentYear
    })

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Already exists', 'You already have a budget for this category this month.')
      } else {
        Alert.alert('Error', error.message)
      }
    } else {
      Alert.alert('Success', 'Budget created!')
      navigation.goBack()
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New budget</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={styles.label}>Budget group (optional)</Text>
        <View style={styles.groupGrid}>
          {budgetGroups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={[
                styles.groupBtn,
                selectedGroup?.id === group.id && { backgroundColor: group.color, borderColor: group.color }
              ]}
              onPress={() => setSelectedGroup(group)}
            >
              <Text style={[
                styles.groupText,
                selectedGroup?.id === group.id && styles.groupTextActive
              ]}>
                {group.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addGroupBtn} onPress={() => setShowNewGroup(!showNewGroup)}>
            <Text style={styles.addGroupBtnText}>+ New group</Text>
          </TouchableOpacity>
        </View>

        {showNewGroup && (
          <View style={styles.newGroupRow}>
            <TextInput
              style={styles.newGroupInput}
              placeholder="e.g. Qatar Living, Kenya Family"
              placeholderTextColor="#aaa"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <TouchableOpacity style={styles.newGroupSaveBtn} onPress={handleCreateGroup}>
              <Text style={styles.newGroupSaveText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catBtn, selectedCategory?.id === cat.id && styles.catBtnActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catText, selectedCategory?.id === cat.id && styles.catTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Monthly limit ({profile?.work_currency || 'QAR'})</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#aaa"
          value={amountLimit}
          onChangeText={setAmountLimit}
          keyboardType="decimal-pad"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Create budget</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  inner: { padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { fontSize: 15, color: '#185FA5' },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  label: { fontSize: 13, fontWeight: '500', color: '#444', marginBottom: 8 },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  groupBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 0.5, borderColor: '#ddd', backgroundColor: '#fff' },
  groupText: { fontSize: 13, fontWeight: '500', color: '#333' },
  groupTextActive: { color: '#fff' },
  addGroupBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 0.5, borderColor: '#185FA5', borderStyle: 'dashed' },
  addGroupBtnText: { fontSize: 13, color: '#185FA5', fontWeight: '500' },
  newGroupRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  newGroupInput: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 0.5, borderColor: '#ddd' },
  newGroupSaveBtn: { backgroundColor: '#185FA5', borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  newGroupSaveText: { color: '#fff', fontWeight: '500' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 0.5, borderColor: '#ddd', backgroundColor: '#fff' },
  catBtnActive: { backgroundColor: '#185FA5', borderColor: '#185FA5' },
  catIcon: { fontSize: 16 },
  catText: { fontSize: 13, color: '#333', fontWeight: '500' },
  catTextActive: { color: '#fff' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 15, color: '#1a1a1a', marginBottom: 20, borderWidth: 0.5, borderColor: '#ddd' },
  saveBtn: { backgroundColor: '#185FA5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
})