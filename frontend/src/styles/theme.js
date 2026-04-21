import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1B5E20",
      light: "#4C8C4A",
      dark: "#003300",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#F9A825",
      light: "#FFD95A",
      dark: "#C17900",
      contrastText: "#000000",
    },
    background: {
      default: "#F5F5F5",
      paper: "#FFFFFF",
    },
    error: {
      main: "#D32F2F",
    },
    warning: {
      main: "#ED6C02",
    },
    info: {
      main: "#0288D1",
    },
    success: {
      main: "#2E7D32",
    },
    text: {
      primary: "#212121",
      secondary: "#616161",
    },
    divider: "#E0E0E0",
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 20px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            fontWeight: 600,
            backgroundColor: "#F5F5F5",
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: "none",
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 72,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 56,
          paddingTop: 10,
          "&.Mui-selected": {
            color: "#1B5E20",
          },
        },
        label: {
          fontSize: "0.72rem",
          "&.Mui-selected": {
            fontSize: "0.74rem",
            fontWeight: 700,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "medium",
      },
    },
  },
});

export default theme;
