import { createTheme } from '@mui/material/styles';

// Tutto Baby Green Palette
const green1 = '#dfeed6'; // Lightest Green
const green2 = '#c4deb7';
const green3 = '#aac59a';
const green4 = '#8da27d'; // Darkest Green

// Define the custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: green4, // Darkest green as primary
      light: green3,
      dark: '#7a916d', // Slightly darker shade for contrast if needed
      contrastText: '#ffffff', // White text on primary color
    },
    secondary: {
      main: green3, // Next darkest green as secondary
      light: green2,
      dark: '#9ab48a', // Slightly darker shade
      contrastText: '#333333', // Dark text on secondary color
    },
    accent: {
      main: green2,
    },
    background: {
      default: green1, // Lightest green as default background
      paper: '#ffffff', // White for paper elements like Cards, Drawers
    },
    text: {
      primary: '#333333', // Dark Gray for primary text
      secondary: '#555555', // Slightly lighter gray for secondary text
    },
    // You can add error, warning, info, success colors if needed
    // error: { main: red[500] },
  },
  typography: {
    fontFamily: 'sans-serif', // Default sans-serif, consider adding a specific font later
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
    // Add other typography variants as needed
  },
  components: {
    // You can override default component styles here
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: green4, // Ensure AppBar uses primary color
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff', // Ensure Drawer background is white
        },
      },
    },
    // Add more component overrides for a consistent look
  },
});

export default theme;

