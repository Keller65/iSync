// import { useEffect, useRef } from "react";
// import { NavigationContainerRef, useNavigationContainerRef } from "@react-navigation/native";
// import analytics from "@react-native-firebase/analytics";

// /**
//  * Hook que registra automáticamente vistas de pantalla en Firebase Analytics
//  */
// export function useAnalytics() {
//   const navigationRef = useNavigationContainerRef();
//   const routeNameRef = useRef<string | undefined>(undefined);

//   useEffect(() => {
//     const unsubscribe = navigationRef.addListener("state", async () => {
//       const currentRoute = navigationRef.getCurrentRoute();
//       const currentScreen = currentRoute?.name;

//       if (currentScreen && routeNameRef.current !== currentScreen) {
//         routeNameRef.current = currentScreen;

//         // Enviar evento de vista de pantalla
//         await analytics().logScreenView({
//           screen_name: currentScreen,
//           screen_class: currentScreen,
//         });

//         console.log("📊 Analytics → screen_view:", currentScreen);
//       }
//     });

//     return unsubscribe;
//   }, [navigationRef]);

//   return navigationRef;
// }