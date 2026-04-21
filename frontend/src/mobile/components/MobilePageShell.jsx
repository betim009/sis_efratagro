import { Box, Stack, Typography } from "@mui/material";

export default function MobilePageShell({ title, subtitle, children }) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: "1.4rem" }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Stack>
  );
}
