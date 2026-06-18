import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import DashboardScreen from './DashboardScreen'
import TransactionsScreen from './TransactionsScreen'
import BudgetScreen from './BudgetScreen'
import ProfileScreen from './ProfileScreen'


const Tab = createBottomTabNavigator()

function TabIcon({ name, focused }) {
  const icons = {
    Dashboard: focused ? '⬛' : '⬜',
    Transactions: focused ? '💳' : '💳',
    Budget: focused ? '📊' : '📊',
    Profile: focused ? '👤' : '👤',
  }
  return <Text style={{ fontSize: 20 }}>{icons[name]}</Text>
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#185FA5',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: '#eee',
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}