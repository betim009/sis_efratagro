import { Box, Typography } from "@mui/material";

export default function FormSection({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      {title && (
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ mb: 1.5, fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}
        >
          {title}
        </Typography>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {children}
      </Box>
    </Box>
  );
}
