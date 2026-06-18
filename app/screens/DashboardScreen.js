import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function DashboardScreen() {
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewCurrency, setViewCurrency] = useState('work')

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const monthName = new Date().toLocaleString('default', { month: 'long' })

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: txData } = await supabase
      .from('transactions')
      .select('*, categories(name, icon, color)')
      .eq('user_id', user.id)
      .gte('transaction_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
      .order('transaction_date', { ascending: false })

    setProfile(profileData)
    setTransactions(txData || [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { fetchData() }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchData()
  }, [])

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const balance = totalIncome - totalExpenses
  const rate = profile?.exchange_rate || 1

  function convert(amount) {
    return viewCurrency === 'home' ? (amount * rate).toFixed(2) : amount.toFixed(2)
  }

  function getCurrency() {
    return viewCurrency === 'home'
      ? (profile?.home_currency || 'HOME')
      : (profile?.work_currency || 'QAR')
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#185FA5" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.name}>{profile?.full_name || 'there'} 👋</Text>
        </View>
        <View style={styles.currencyToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewCurrency === 'work' && styles.toggleActive]}
            onPress={() => setViewCurrency('work')}
          >
            <Text style={[styles.toggleText, viewCurrency === 'work' && styles.toggleTextActive]}>
              {profile?.work_currency || 'QAR'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewCurrency === 'home' && styles.toggleActive]}
            onPress={() => setViewCurrency('home')}
          >
            <Text style={[styles.toggleText, viewCurrency === 'home' && styles.toggleTextActive]}>
              {profile?.home_currency || 'HOME'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{monthName} balance</Text>
        <Text style={styles.balanceAmount}>
          {getCurrency()} {convert(balance)}
        </Text>
        <Text style={styles.balanceSub}>
          {balance >= 0 ? 'You are on track' : 'You are overspending'}
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderLeftColor: '#1D9E75' }]}>
          <Text style={styles.metricLabel}>Income</Text>
          <Text style={[styles.metricAmount, { color: '#1D9E75' }]}>
            {getCurrency()} {convert(totalIncome)}
          </Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: '#E24B4A' }]}>
          <Text style={styles.metricLabel}>Expenses</Text>
          <Text style={[styles.metricAmount, { color: '#E24B4A' }]}>
            {getCurrency()} {convert(totalExpenses)}
          </Text>
        </View>
      </View>

      {profile?.exchange_rate && (
        <View style={styles.rateBar}>
          <Text style={styles.rateText}>
            1 {profile.work_currency} = {profile.exchange_rate} {profile.home_currency}
          </Text>
          <Text style={styles.rateUpdate}>Manual rate</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent transactions</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No transactions this month yet.</Text>
            <Text style={styles.emptySubText}>Tap + to add your first one.</Text>
          </View>
        ) : (
          transactions.slice(0, 5).map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: tx.categories?.color + '22' }]}>
                <Text style={styles.txIconText}>{tx.categories?.icon || '💰'}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txName}>{tx.categories?.name || 'Uncategorized'}</Text>
                <Text style={styles.txDate}>{tx.transaction_date}</Text>
              </View>
              <Text style={[
                styles.txAmount,
                { color: tx.type === 'income' ? '#1D9E75' : '#E24B4A' }
              ]}>
                {tx.type === 'income' ? '+' : '-'} {getCurrency()} {convert(parseFloat(tx.amount))}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20
  },
  greeting: { fontSize: 14, color: '#888' },
  name: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
  currencyToggle: { flexDirection: 'row', backgroundColor: '#e8e8e8', borderRadius: 8, padding: 3 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  toggleActive: { backgroundColor: '#185FA5' },
  toggleText: { fontSize: 12, fontWeight: '500', color: '#666' },
  toggleTextActive: { color: '#fff' },
  balanceCard: {
    backgroundColor: '#185FA5', margin: 20, borderRadius: 16,
    padding: 24, alignItems: 'center'
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  balanceAmount: { fontSize: 36, fontWeight: '700', color: '#fff', marginBottom: 6 },
  balanceSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  metricsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  metricCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 16, borderLeftWidth: 4
  },
  metricLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  metricAmount: { fontSize: 18, fontWeight: '600' },
  rateBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: '#fff', borderRadius: 10,
    padding: 12, borderWidth: 0.5, borderColor: '#eee'
  },
  rateText: { fontSize: 13, color: '#444' },
  rateUpdate: { fontSize: 12, color: '#888' },
  section: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  emptyBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 24,
    alignItems: 'center', borderWidth: 0.5, borderColor: '#eee'
  },
  emptyText: { fontSize: 15, color: '#444', marginBottom: 4 },
  emptySubText: { fontSize: 13, color: '#888' },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 0.5, borderColor: '#eee'
  },
  txIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  txDate: { fontSize: 12, color: '#888', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '600' }
})