// import MapBox from '@rnmapbox/maps';

// import { View, StyleSheet } from 'react-native';


// const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

// if (token) MapBox.setAccessToken(token);

// export default function Index() {

//     return (
//         <View style={styles.container}>
//         <MapBox.MapView style={styles.map}>
//           <MapBox.Camera zoomLevel={11} centerCoordinate={[-122.4194, 37.7749]} />
//         </MapBox.MapView>
//       </View>
//     );
// }
// const styles = StyleSheet.create({
//     container: { flex: 1 },
//     map: { flex: 1 },});
import { Text, View, SafeAreaView, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "@/context/AuthContext";
import TextCustom from "@/components/TextCustom";


export default function Index() {
  const { user, session, signout } = useAuth();

  return (
    <SafeAreaView>
          <TouchableOpacity 
            style={styles.button} 
            onPress={signout}
            >
            <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
        <View style={styles.container}>
            {/* <TextCustom fontSize={22}>Protected Routex</TextCustom> */}
            {session && user && (
              <TextCustom fontSize={22}>Hello {user?.name ?? "there"}!</TextCustom>
            )}
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{
    paddingHorizontal:20,

  },
  headline:{
    paddingVertical:20
  },
    button: {
      backgroundColor: 'black',
      padding: 12,
      borderRadius: 6,
      alignItems: 'center',
      margin:20,
    },
    buttonText: {
      color: 'white',
      fontSize: 18,
    },
})