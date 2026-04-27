/**
 * MUI Theme
 * Philippine Coast Guard Personnel System
 */

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary:    { main: '#2563eb' },  // blue-600
    error:      { main: '#dc2626' },  // red-600
    success:    { main: '#16a34a' },  // green-600
    warning:    { main: '#d97706' },  // amber-600
    secondary:  { main: '#7c3aed' },  // purple-600
    background: { default: '#f9fafb', paper: '#ffffff' },
    text:       { primary: '#111827', secondary: '#6b7280' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'small' },
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiSelect:    { defaultProps: { size: 'small' } },
    MuiChip:      { styleOverrides: { root: { fontWeight: 600 } } },
    MuiDialog:    { defaultProps: { PaperProps: { elevation: 4 } } },
    MuiCard:      { defaultProps: { elevation: 2 } },
    MuiPaper:     { defaultProps: { elevation: 1 } },
  },
});
