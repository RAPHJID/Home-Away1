import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from 'react-native'
import { supabase } from '../lib/supabase'

const SUGGESTIONS = [
  'How am I doing this month?',
  'Where am I overspending?',
  'How much have I sent home?',
  'How can I save more?',
]

export default function AIScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      text: "Hello! I'm Rafik, your personal finance friend. I can help you understand your spending, track your savings goals, and give you advice on managing money between Qatar and your home country. What would you like to know?"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const flatListRef = useRef(null)

  async function fetchUserContext() {
    const { data: { user } } = await supabase.auth.getUser()
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', user.id)
      .gte('transaction_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)

    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, categories(name)')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .eq('year', currentYear)

    const totalIncome = transactions
      ?.filter(t => t.type === 'income')
      .reduce((s, t) => s + parseFloat(t.amount), 0) || 0

    const totalExpenses = transactions
      ?.filter(t => t.type === 'expense')
      .reduce((s, t) => s + parseFloat(t.amount), 0) || 0

    const topCategories = transactions
      ?.filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const name = t.categories?.name || 'Other'
        acc[name] = (acc[name] || 0) + parseFloat(t.amount)
        return acc
      }, {})

    return {
      profile,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      budgets: budgets || [],
      topCategories: topCategories || {},
      transactionCount: transactions?.length || 0
    }
  }

  function buildSystemPrompt(context) {
    const { profile, totalIncome, totalExpenses, balance, budgets, topCategories } = context
    const overBudget = budgets.filter(b => b.amount_spent > b.amount_limit)

    return `You are Rafik, a friendly and practical finance friend for migrant workers. 
The user works in ${profile?.work_country || 'Qatar'} and sends money home to ${profile?.home_country || 'their home country'}.
Exchange rate: 1 ${profile?.work_currency || 'QAR'} = ${profile?.exchange_rate || 1} ${profile?.home_currency || 'HOME'}.

This month's summary:
- Total income: ${profile?.work_currency} ${totalIncome.toFixed(2)}
- Total expenses: ${profile?.work_currency} ${totalExpenses.toFixed(2)}
- Balance: ${profile?.work_currency} ${balance.toFixed(2)}
- Top spending categories: ${Object.entries(topCategories).sort((a,b) => b[1]-a[1]).slice(0,5).map(([k,v]) => `${k}: ${v.toFixed(2)}`).join(', ')}
- Budgets over limit: ${overBudget.length > 0 ? overBudget.map(b => b.categories?.name).join(', ') : 'None'}

Keep responses short, practical and encouraging. Use their actual numbers when giving advice.
Always respond in English unless the user writes in another language.
Never make up numbers — only use the data provided above.`
  }

  async function handleSend(text) {
    const messageText = text || input.trim()
    if (!messageText) return

    const userMessage = { id: Date.now().toString(), role: 'user', text: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const context = await fetchUserContext()
      const systemPrompt = buildSystemPrompt(context)

      const conversationHistory = messages
        .filter(m => m.role !== 'assistant' || m.id !== '1')
        .map(m => ({ role: m.role, content: m.text }))

      conversationHistory.push({ role: 'user', content: messageText })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'YOUR_ANTHROPIC_API_KEY',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-client-side-request-header': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: conversationHistory
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      const aiText = data.content?.[0]?.text || "I couldn't process that. Please try again."

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: aiText
      }])

    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I'm not available right now. Please check your connection and try again."
      }])
    }

    setLoading(false)
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>AI</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Rafik</Text>
          <Text style={styles.headerSub}>Your finance friend 🤝</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          loading ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#185FA5" />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.role === 'user' ? styles.userBubble : styles.aiBubble
          ]}>
            <Text style={[
              styles.messageText,
              item.role === 'user' ? styles.userText : styles.aiText
            ]}>
              {item.text}
            </Text>
          </View>
        )}
      />

      <View style={styles.suggestionsRow}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={styles.suggestionBtn}
            onPress={() => handleSend(s)}
          >
            <Text style={styles.suggestionText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your finances..."
          placeholderTextColor="#aaa"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 0.5, borderBottomColor: '#eee',
    backgroundColor: '#fff'
  },
  aiAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#185FA5', justifyContent: 'center', alignItems: 'center'
  },
  aiAvatarText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  headerSub: { fontSize: 12, color: '#888' },
  messageList: { padding: 16, paddingBottom: 8 },
  messageBubble: {
    maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 8
  },
  userBubble: { backgroundColor: '#185FA5', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 0.5, borderColor: '#eee' },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#1a1a1a' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  typingText: { fontSize: 13, color: '#888' },
  suggestionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8
  },
  suggestionBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 16, backgroundColor: '#fff',
    borderWidth: 0.5, borderColor: '#ddd'
  },
  suggestionText: { fontSize: 12, color: '#185FA5' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#eee'
  },
  input: {
    flex: 1, backgroundColor: '#f8f8f6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#1a1a1a', maxHeight: 100,
    borderWidth: 0.5, borderColor: '#ddd'
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#185FA5', justifyContent: 'center', alignItems: 'center'
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '600' }
})