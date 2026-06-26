import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { 
  Users, 
  GraduationCap, 
  Star, 
  Award, 
  Briefcase, 
  ClipboardList, 
  BarChart3, 
  Building2 
} from 'lucide-react-native';
import { Colors, FontSize, FontFamily, Radius, Spacing } from '@/constants/colors';

export type HomeMenuItem = {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
};

type Props = {
  menus: HomeMenuItem[];
};

const IconMap: { [key: string]: React.ComponentType<any> } = {
  keluarga: Users,
  pendidikan: GraduationCap,
  keahlian: Star,
  kursus: Award,
  pengalaman: Briefcase,
  hist_absensi: ClipboardList,
  laporan_pegawai: BarChart3,
  hrd: Building2,
  laporan_hrd: BarChart3,
};

export default function HomeMenuGrid({ menus }: Props) {
  return (
    <View style={styles.container}>
      {menus.map((item) => {
        const IconComponent = IconMap[item.key] || Star;
        return (
          <TouchableOpacity key={item.key} style={styles.item} onPress={item.onPress}>
            <View style={styles.iconWrapper}>
              <IconComponent size={24} color={Colors.primary[500]} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    justifyContent: 'space-between',
  },
  item: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.primary[100],
    elevation: 0,
    shadowOpacity: 0,
  },
  label: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.neutral[900],
    lineHeight: 18,
  },
});