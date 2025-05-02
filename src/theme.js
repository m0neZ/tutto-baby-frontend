import { createTheme } from '@mui/material/styles';

// Tutto Baby Green Palette
const green1 = '#dfeed6'; // Lightest Green
const green2 = '#c4deb7';
const green3 = '#aac59a';
const green4 = '#8da27d'; // Darkest Green

// New Accent Colors (from Llama illustration)
const pink1 = '#f7c5d0'; // Soft Pink
const blue1 = '#bde0fe'; // Light Blue

// Define the custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: green4, // Darkest green as primary
      light: green3,
      dark: '#7a916d',
      contrastText: '#ffffff',
    },
    secondary: {
      main: pink1, // Use Soft Pink as secondary
      light: '#f9d4de',
      dark: '#e0b1bc',
      contrastText: '#333333',
    },
    accent: {
      main: blue1, // Use Light Blue as accent
      light: '#d0e9fe',
      dark: '#a8cce6',
      contrastText: '#333333',
    },
    background: {
      default: green1, // Lightest green as default background
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#555555',
    },
    // Keep the original green shades accessible if needed
    greens: {
      lightest: green1,
      light: green2,
      medium: green3,
      dark: green4,
    },
    // error: { main: red[500] },
  },
  typography: {
    fontFamily: 'sans-serif',
    h1: {
      fontSize: '2.2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: green4,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        // Example: Make contained buttons use the accent blue
        containedPrimary: { // Target primary contained buttons
          backgroundColor: blue1,
          color: '#333333',
          '&:hover': {
            backgroundColor: '#a8cce6', // Darker blue on hover
          },
        },
        // Example: Make outlined secondary buttons use the secondary pink
        outlinedSecondary: {
          borderColor: pink1,
          color: pink1,
          '&:hover': {
            borderColor: '#e0b1bc',
            backgroundColor: 'rgba(247, 197, 208, 0.08)', // Light pink background on hover
          },
        },
      },
    },
    MuiTableHead: {
        styleOverrides: {
            root: {
                backgroundColor: pink1, // Use pink for table headers
            }
        }
    },
    MuiTableCell: {
        styleOverrides: {
            head: {
                color: '#333333', // Ensure text is readable on pink
                fontWeight: 'bold',
            }
        }
    }
  },
});

export default theme;

