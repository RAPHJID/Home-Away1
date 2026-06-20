import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function BudgetScreen({ navigation }) {
  const [budgets, setBudgets] = useState([])
  const [budgetGroups, setBudgetGroups] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*, categories(name, icon, color), budget_groups(name, color)')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .eq('year', currentYear)

    setProfile(profileData)
    setBudgets(budgetData || [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { fetchData() }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchData()
  }, [])

  const grouped = budgets.reduce((acc, b) => {
    const groupName = b.budget_groups?.name || 'Ungrouped'
    if (!acc[groupName]) acc[groupName] = { color: b.budget_groups?.color || '#888', items: [] }
    acc[groupName].items.push(b)
    return acc
  }, {})

  const totalLimit = budgets.reduce((sum, b) => sum + parseFloat(b.amount_limit), 0)
  const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.amount_spent), 0)

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
        <Text style={styles.title}>Budgets</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddBudget')}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>This month total</Text>
        <Text style={styles.summaryAmount}>
          {profile?.work_currency} {totalSpent.toFixed(2)} <Text style={styles.summaryOf}>/ {totalLimit.toFixed(2)}</Text>
        </Text>
        <View style={styles.summaryBarBg}>
          <View style={[
            styles.summaryBarFill,
            {
              width: `${Math.min((totalSpent / totalLimit) * 100 || 0, 100)}%`,
              backgroundColor: totalSpent > totalLimit ? '#E24B4A' : '#185FA5'
            }
          ]} />
        </View>
      </View>

      {budgets.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No budgets set for this month</Text>
          <Text style={styles.emptySubText}>Tap "+ New" to create your first budget</Text>
        </View>
      ) : (
        Object.keys(grouped).map((groupName) => (
          <View key={groupName} style={styles.groupSection}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupDot, { backgroundColor: grouped[groupName].color }]} />
              <Text style={styles.groupTitle}>{groupName}</Text>
            </View>
            {grouped[groupName].items.map((b) => {
              const pct = (parseFloat(b.amount_spent) / parseFloat(b.amount_limit)) * 100
              const isOver = pct > 100
              return (
                <View key={b.id} style={styles.budgetCard}>
                  <View style={styles.budgetTop}>
                    <View style={styles.budgetCatRow}>
                      <Text style={styles.budgetIcon}>{b.categories?.icon}</Text>
                      <Text style={styles.budgetCatName}>{b.categories?.name}</Text>
                    </View>
                    <Text style={[styles.budgetPct, isOver && { color: '#E24B4A' }]}>
                      {pct.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.budgetBarBg}>
                    <View style={[
                      styles.budgetBarFill,
                      { width: `${Math.min(pct, 100)}%`, backgroundColor: isOver ? '#E24B4A' : (pct > 80 ? '#EF9F27' : '#1D9E75') }
                    ]} />
                  </View>
                  <View style={styles.budgetBottom}>
                    <Text style={styles.budgetSpent}>
                      {profile?.work_currency} {parseFloat(b.amount_spent).toFixed(2)} spent
                    </Text>
                    <Text style={styles.budgetLimit}>
                      of {parseFloat(b.amount_limit).toFixed(2)}
                    </Text>
                  </View>
                  {isOver && (
                    <Text style={styles.overWarning}>⚠️ Over budget by {profile?.work_currency} {(b.amount_spent - b.amount_limit).toFixed(2)}</Text>
                  )}
                </View>
              )
            })}
          </View>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16
  },
  title: { fontSize: 22, fontWeight: '600', color: '#1a1a1a' },
  addBtn: { backgroundColor: '#185FA5', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  summaryCard: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16,
    padding: 20, marginBottom: 20, borderWidth: 0.5, borderColor: '#eee'
  },
  summaryLabel: { fontSize: 13, color: '#888', marginBottom: 6 },
  summaryAmount: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  summaryOf: { fontSize: 16, fontWeight: '400', color: '#888' },
  summaryBarBg: { height: 8, borderRadius: 4, backgroundColor: '#eee' },
  summaryBarFill: { height: '100%', borderRadius: 4 },
  groupSection: { paddingHorizontal: 20, marginBottom: 24 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  groupDot: { width: 10, height: 10, borderRadius: 5 },
  groupTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  budgetCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 0.5, borderColor: '#eee'
  },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetCatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetIcon: { fontSize: 16 },
  budgetCatName: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  budgetPct: { fontSize: 13, fontWeight: '600', color: '#1D9E75' },
  budgetBarBg: { height: 6, borderRadius: 3, backgroundColor: '#eee', marginBottom: 8 },
  budgetBarFill: { height: '100%', borderRadius: 3 },
  budgetBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetSpent: { fontSize: 12, color: '#666' },
  budgetLimit: { fontSize: 12, color: '#888' },
  overWarning: { fontSize: 12, color: '#E24B4A', marginTop: 8, fontWeight: '500' },
  emptyBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 40,
    alignItems: 'center', marginHorizontal: 20,
    borderWidth: 0.5, borderColor: '#eee'
  },
  emptyText: { fontSize: 16, color: '#444', marginBottom: 4, fontWeight: '500' },
  emptySubText: { fontSize: 13, color: '#888', textAlign: 'center' }
})