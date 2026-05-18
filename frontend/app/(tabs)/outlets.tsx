import { View, ScrollView } from "react-native"
import BluHouseBlueprintRelayePrint from "@/components/bluePrint"
import { globalStyles } from '@/styles/global';
function explore() {
  return (
    <ScrollView style={globalStyles.container}> 
      <View>
        <BluHouseBlueprintRelayePrint/>
      </View>
    </ScrollView>
  )
}

export default explore
