import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native'
import { supabase } from '../lib/supabase'

const FILTERS = ['All', 'Income', 'Expense']

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')

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
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

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

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Income') return tx.type === 'income'
    if (activeFilter === 'Expense') return tx.type === 'expense'
    return true
  })

  const groupedByDate = filteredTransactions.reduce((groups, tx) => {
    const date = tx.transaction_date
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
    return groups
  }, {})

  const sections = Object.keys(groupedByDate).map(date => ({
    date,
    data: groupedByDate[date]
  }))

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function getDayTotal(txs) {
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    return income - expense
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#185FA5" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterBtn, activeFilter === filter && styles.filterBtnActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.date}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubText}>Tap the + button to add your first one</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateLabel}>{formatDate(item.date)}</Text>
              <Text style={[
                styles.dateTotalLabel,
                { color: getDayTotal(item.data) >= 0 ? '#1D9E75' : '#E24B4A' }
              ]}>
                {getDayTotal(item.data) >= 0 ? '+' : ''}{profile?.work_currency} {getDayTotal(item.data).toFixed(2)}
              </Text>
            </View>
            {item.data.map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: (tx.categories?.color || '#185FA5') + '22' }]}>
                  <Text style={styles.txIconText}>{tx.categories?.icon || '💰'}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txName}>{tx.categories?.name || 'Uncategorized'}</Text>
                  {tx.note ? <Text style={styles.txNote}>{tx.note}</Text> : null}
                </View>
                <Text style={[
                  styles.txAmount,
                  { color: tx.type === 'income' ? '#1D9E75' : '#E24B4A' }
                ]}>
                  {tx.type === 'income' ? '+' : '-'} {tx.currency} {parseFloat(tx.amount).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '600', color: '#1a1a1a' },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16
  },
  filterBtn: {
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 0.5, borderColor: '#ddd'
  },
  filterBtnActive: { backgroundColor: '#185FA5', borderColor: '#185FA5' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#666' },
  filterTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  dateGroup: { marginBottom: 20 },
  dateHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10
  },
  dateLabel: { fontSize: 13, fontWeight: '600', color: '#888', textTransform: 'uppercase' },
  dateTotalLabel: { fontSize: 13, fontWeight: '600' },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 0.5, borderColor: '#eee'
  },
  txIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  txNote: { fontSize: 12, color: '#888', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '600' },
  emptyBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 40,
    alignItems: 'center', marginTop: 40,
    borderWidth: 0.5, borderColor: '#eee'
  },
  emptyText: { fontSize: 16, color: '#444', marginBottom: 4, fontWeight: '500' },
  emptySubText: { fontSize: 13, color: '#888', textAlign: 'center' }
})