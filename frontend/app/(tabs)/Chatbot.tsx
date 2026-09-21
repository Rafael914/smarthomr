import {View,ScrollView} from "react-native";
import Chatbot from "@/components/chatBot";
import { globalStyles } from '@/styles/global';

function chatbot(){
    return (
        <ScrollView style={globalStyles.container}>
        <View>
          <Chatbot/>
        </View>
        </ScrollView>
    )
}

export default chatbot;