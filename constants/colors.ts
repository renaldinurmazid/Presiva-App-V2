// theme.ts & colors.ts — Design System Implementation

export const Colors = {
  primary:  { 
    50: '#EBF4FE', 
    100: '#D6E8FB', 
    300: '#7DB3F0', 
    400: '#4D95EA', 
    500: '#2880E3' 
  },
  neutral:  { 
    0: '#FFFFFF', 
    50: '#F7F9FB', 
    100: '#EEF2F6', 
    300: '#B8C4D0',
    500: '#6B7A8D', 
    700: '#3B4A5A', 
    900: '#0F1923' 
  },
  success:  { 
    100: '#DCFCE7', 
    500: '#22C55E' 
  },
  warning:  { 
    100: '#FEF3C7', 
    500: '#F59E0B' 
  },
  danger:   { 
    100: '#FEE2E2', 
    500: '#EF4444' 
  },
};

export const FontSize = { 
  xs: 10, 
  sm: 12, 
  base: 14, 
  md: 16, 
  lg: 18, 
  xl: 20 
};

export const FontFamily = {
  regular:  'Poppins_400Regular',
  medium:   'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold:     'Poppins_700Bold',
};

export const Radius = { 
  sm: 6, 
  md: 10, 
  lg: 14, 
  xl: 20, 
  full: 9999 
};

export const Spacing = { 
  1: 4, 
  2: 8, 
  3: 12, 
  4: 16, 
  5: 20, 
  6: 24, 
  8: 32, 
  10: 40 
};

// Legacy compatibility object mapped directly to the new design system tokens
export const COLORS = {
  primary: Colors.primary[500],
  primaryDark: Colors.primary[400],
  primaryLight: Colors.primary[300],
  accentOrange: Colors.warning[500],
  accentOrangeDark: '#D96C00', // fallback compatibility
  white: Colors.neutral[0],
  background: Colors.neutral[50],
  surface: Colors.neutral[0],
  textPrimary: Colors.neutral[900],
  textSecondary: Colors.neutral[700],
  border: Colors.neutral[100],
  success: Colors.success[500],
  warning: Colors.warning[500],
  danger: Colors.danger[500],
  muted: Colors.neutral[500],
};