import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingRate, setEditingRate] = useState(false)
  const [newRate, setNewRate] = useState('')

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
    setNewRate(data?.exchange_rate?.toString() || '')
    setLoading(false)
  }

  async function handleUpdateRate() {
    if (!newRate || isNaN(parseFloat(newRate))) {
      Alert.alert('Error', 'Please enter a valid exchange rate')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('profiles')
      .update({ exchange_rate: parseFloat(newRate), updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      await fetchProfile()
      setEditingRate(false)
      Alert.alert('Updated', 'Exchange rate saved')
    }
    setSaving(false)
  }

  async function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => await supabase.auth.signOut() }
    ])
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#185FA5" />
      </View>
    )
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'No name set'}</Text>
        <Text style={styles.phone}>{profile?.phone || ''}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Work country</Text>
          <Text style={styles.rowValue}>{profile?.work_country} ({profile?.work_currency})</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Home country</Text>
          <Text style={styles.rowValue}>{profile?.home_country} ({profile?.home_currency})</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exchange rate</Text>
        <View style={styles.rateCard}>
          {editingRate ? (
            <>
              <Text style={styles.rateLabel}>
                1 {profile?.work_currency} =
              </Text>
              <TextInput
                style={styles.rateInput}
                value={newRate}
                onChangeText={setNewRate}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={styles.rateLabel}>{profile?.home_currency}</Text>
              <View style={styles.rateBtnRow}>
                <TouchableOpacity style={styles.rateCancelBtn} onPress={() => setEditingRate(false)}>
                  <Text style={styles.rateCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rateSaveBtn} onPress={handleUpdateRate} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.rateSaveText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.rateDisplay}>
                1 {profile?.work_currency} = {profile?.exchange_rate} {profile?.home_currency}
              </Text>
              <Text style={styles.rateUpdated}>
                Last updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}
              </Text>
              <TouchableOpacity style={styles.editRateBtn} onPress={() => setEditingRate(true)}>
                <Text style={styles.editRateBtnText}>Update rate</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Log out</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#185FA5', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12
  },
  avatarText: { fontSize: 26, fontWeight: '600', color: '#fff' },
  name: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  phone: { fontSize: 13, color: '#888', marginTop: 2 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: 10 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#fff', padding: 14, borderRadius: 10,
    marginBottom: 8, borderWidth: 0.5, borderColor: '#eee'
  },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  rateCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 0.5, borderColor: '#eee'
  },
  rateDisplay: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 6 },
  rateUpdated: { fontSize: 12, color: '#888', marginBottom: 14 },
  editRateBtn: {
    backgroundColor: '#185FA5', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center'
  },
  editRateBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  rateLabel: { fontSize: 14, color: '#444', marginBottom: 6 },
  rateInput: {
    backgroundColor: '#f8f8f6', borderRadius: 8, padding: 12,
    fontSize: 18, fontWeight: '600', color: '#1a1a1a',
    borderWidth: 0.5, borderColor: '#ddd', marginBottom: 6
  },
  rateBtnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  rateCancelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 0.5, borderColor: '#ddd', alignItems: 'center'
  },
  rateCancelText: { fontSize: 14, color: '#666' },
  rateSaveBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#185FA5', alignItems: 'center'
  },
  rateSaveText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  logoutBtn: {
    marginHorizontal: 20, backgroundColor: '#fff',
    borderRadius: 10, padding: 14, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#E24B4A'
  },
  logoutBtnText: { color: '#E24B4A', fontSize: 15, fontWeight: '500' }
})