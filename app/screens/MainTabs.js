import { View, Text, StyleSheet } from 'react-native'

export default function MainTabs() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard coming soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f6' },
  text: { fontSize: 18, color: '#185FA5' }
})