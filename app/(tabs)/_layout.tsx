import { Tabs, useRouter } from "expo-router";
import React from "react";
import {
  Home,
  ScanLine,
  ClipboardList,
  LogOut,
  Barcode,
} from "lucide-react-native";
import { Colors, FontFamily } from "@/constants/colors";
import { Alert } from "react-native";
import { useAuthStore } from "@/store/auth.store";
import { setAuthToken } from "@/services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin logout?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          setAuthToken(undefined);
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const tabBarHeight = 64 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.neutral[500],
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          backgroundColor: Colors.neutral[0],
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[100],
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: FontFamily.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="barcode"
        options={{
          title: "Barcode",
          tabBarIcon: ({ color }) => <Barcode size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan QR",
          tabBarIcon: ({ color }) => <ScanLine size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="absensi"
        options={{
          title: "Absensi",
          tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="logout"
        options={{
          title: "Logout",
          tabBarIcon: ({ color }) => <LogOut size={22} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleLogout();
          },
        }}
      />
    </Tabs>
  );
}
