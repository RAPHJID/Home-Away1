import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../lib/supabase'

export default function ProfileScreen() {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f6' },
  text: { fontSize: 18, color: '#185FA5', marginBottom: 24 },
  button: { backgroundColor: '#E24B4A', borderRadius: 10, padding: 14, paddingHorizontal: 32 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '500' }
})