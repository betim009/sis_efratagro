import { Box, Stack, Typography } from "@mui/material";

export default function MobileSection({ title, subtitle, action, children, contentSx }) {
  return (
    <Stack spacing={1.5}>
      {(title || subtitle || action) && (
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            {title && (
              <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 700 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
      )}

      <Box sx={contentSx}>{children}</Box>
    </Stack>
  );
}
