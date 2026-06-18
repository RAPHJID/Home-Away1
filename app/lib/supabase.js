import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wuhmtttjktfocxjhqtza.supabase.co/rest/v1/'
const supabaseAnonKey = 'sb_publishable_mYktvoJwKQRvaGSc28-jPA_WBLx9k3w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
