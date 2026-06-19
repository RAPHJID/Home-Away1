import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DashboardScreen from './DashboardScreen'
import TransactionsScreen from './TransactionsScreen'
import BudgetScreen from './BudgetScreen'
import ProfileScreen from './ProfileScreen'
import AddTransactionScreen from './AddTransactionScreen'
import AddCategoryScreen from './AddCategoryScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()


function TabIcon({ emoji, focused }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
}

function AddButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.addBtn} onPress={onPress}>
      <Text style={styles.addBtnText}>+</Text>
    </TouchableOpacity>
  )
}

function Tabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#185FA5',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: '#eee',
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIcon: ({ focused }) => {
          const emojis = {
            Dashboard: '🏠',
            Transactions: '💳',
            Add: '+',
            Budget: '📊',
            Profile: '👤',
          }
          return <TabIcon emoji={emojis[route.name]} focused={focused} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen
        name="Add"
        component={DashboardScreen}
        options={{
          tabBarButton: () => (
            <AddButton onPress={() => navigation.navigate('AddTransaction')} />
          ),
        }}
      />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function MainTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  addBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#185FA5',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#185FA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addBtnText: { fontSize: 28, color: '#fff', fontWeight: '300', marginTop: -2 }
})