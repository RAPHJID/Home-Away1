import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native'
import { supabase } from '../lib/supabase'

const COUNTRIES = [
  { label: 'Kenya', currency: 'KES' },
  { label: 'India', currency: 'INR' },
  { label: 'Pakistan', currency: 'PKR' },
  { label: 'Uganda', currency: 'UGX' },
  { label: 'Nepal', currency: 'NPR' },
  { label: 'Philippines', currency: 'PHP' },
  { label: 'Bangladesh', currency: 'BDT' },
  { label: 'Sri Lanka', currency: 'LKR' },
  { label: 'Ethiopia', currency: 'ETB' },
  { label: 'Ghana', currency: 'GHS' },
]

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    if (!fullName || !email || !password || !selectedCountry) {
      Alert.alert('Error', 'Please fill in all fields and select your home country')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          home_country: selectedCountry.label,
          home_currency: selectedCountry.currency,
        }
      }
    })
    if (error) Alert.alert('Signup failed', error.message)
    else Alert.alert('Success', 'Account created! You can now log in.')
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>

        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#888"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Where is your home country?</Text>
        <View style={styles.countryGrid}>
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.label}
              style={[
                styles.countryBtn,
                selectedCountry?.label === country.label && styles.countryBtnActive
              ]}
              onPress={() => setSelectedCountry(country)}
            >
              <Text style={[
                styles.countryText,
                selectedCountry?.label === country.label && styles.countryTextActive
              ]}>
                {country.label}
              </Text>
              <Text style={[
                styles.currencyText,
                selectedCountry?.label === country.label && styles.countryTextActive
              ]}>
                {country.currency}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Create account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  inner: { padding: 24, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '600', color: '#185FA5', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 32 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    fontSize: 15, color: '#1a1a1a', marginBottom: 12,
    borderWidth: 0.5, borderColor: '#ddd'
  },
  label: { fontSize: 14, color: '#444', marginBottom: 10, fontWeight: '500' },
  countryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  countryBtn: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 0.5, borderColor: '#ddd',
    backgroundColor: '#fff', alignItems: 'center'
  },
  countryBtnActive: { backgroundColor: '#185FA5', borderColor: '#185FA5' },
  countryText: { fontSize: 13, color: '#333', fontWeight: '500' },
  countryTextActive: { color: '#fff' },
  currencyText: { fontSize: 11, color: '#888', marginTop: 2 },
  button: {
    backgroundColor: '#185FA5', borderRadius: 10,
    padding: 15, alignItems: 'center', marginBottom: 16
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  link: { color: '#185FA5', textAlign: 'center', fontSize: 14 }
})