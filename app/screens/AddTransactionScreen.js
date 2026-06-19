import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function AddTransactionScreen({ navigation }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchData() }, [type])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .or(`type.eq.${type},type.eq.both`)
      .order('name')

    setProfile(profileData)
    setCategories(catData || [])
    setSelectedCategory(null)
  }

  async function handleSave() {
    if (!amount || !selectedCategory) {
      Alert.alert('Error', 'Please enter an amount and select a category')
      return
    }
    if (isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const rate = profile?.exchange_rate || 1
    const workCurrency = profile?.work_currency || 'QAR'
    const homeCurrency = profile?.home_currency || ''
    const convertedAmount = (parseFloat(amount) * rate).toFixed(2)

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      category_id: selectedCategory.id,
      type,
      amount: parseFloat(amount),
      currency: workCurrency,
      converted_amount: parseFloat(convertedAmount),
      converted_currency: homeCurrency,
      exchange_rate_used: rate,
      note,
      transaction_date: date,
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      if (type === 'expense') {
        await updateBudgetSpent(user.id, selectedCategory.id, parseFloat(amount))
      }
      Alert.alert('Success', 'Transaction saved!')
      navigation.goBack()
    }
    setLoading(false)
  }

  async function updateBudgetSpent(userId, categoryId, amount) {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { data: budget } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single()

    if (budget) {
      await supabase
        .from('budgets')
        .update({ amount_spent: budget.amount_spent + amount })
        .eq('id', budget.id)
    }
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
          <Text style={styles.title}>Add transaction</Text>
          <View style={{ width: 50 }} />
        </View>

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
        </View>

        <Text style={styles.label}>Amount ({profile?.work_currency || 'QAR'})</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#aaa"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {amount !== '' && profile?.exchange_rate && (
          <Text style={styles.convertedHint}>
            ≈ {profile.home_currency} {(parseFloat(amount || 0) * profile.exchange_rate).toFixed(2)}
          </Text>
        )}

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catBtn,
                selectedCategory?.id === cat.id && styles.catBtnActive
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[
                styles.catText,
                selectedCategory?.id === cat.id && styles.catTextActive
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
        style={styles.addCatBtn}
            onPress={() => navigation.navigate('AddCategory', { type })}
        >
        <Text style={styles.addCatBtnText}>+ Create new category</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="e.g. Monthly rent payment"
          placeholderTextColor="#aaa"
          value={note}
          onChangeText={setNote}
          multiline
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save transaction</Text>
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
  typeText: { fontSize: 14, fontWeight: '500', color: '#666' },
  typeTextActive: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '500', color: '#444', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    fontSize: 15, color: '#1a1a1a', marginBottom: 16,
    borderWidth: 0.5, borderColor: '#ddd'
  },
  noteInput: { height: 80, textAlignVertical: 'top' },
  convertedHint: {
    fontSize: 13, color: '#185FA5', marginTop: -10,
    marginBottom: 16, paddingLeft: 4
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 0.5, borderColor: '#ddd',
    backgroundColor: '#fff'
  },
  catBtnActive: { backgroundColor: '#185FA5', borderColor: '#185FA5' },
  catIcon: { fontSize: 16 },
  catText: { fontSize: 13, color: '#333', fontWeight: '500' },
  catTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#185FA5', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8
  },
  addCatBtn: {
  borderWidth: 0.5, borderColor: '#185FA5', borderRadius: 10,
  padding: 12, alignItems: 'center', marginBottom: 20,
  borderStyle: 'dashed'
},
addCatBtnText: { color: '#185FA5', fontSize: 14, fontWeight: '500' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
})