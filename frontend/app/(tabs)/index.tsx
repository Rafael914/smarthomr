import { StyleSheet, Text, View, ScrollView } from 'react-native';
import DashboardGrid from '@/components/dashboardGrid';
import { globalStyles } from '@/styles/global';

function index() {
  return (
    <ScrollView style={globalStyles.container}>
    <View>
      <DashboardGrid/>
    </View>
    </ScrollView>
  )
}

export default index
