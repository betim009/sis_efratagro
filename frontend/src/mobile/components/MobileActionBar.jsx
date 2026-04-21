import { Box, Button, Stack } from "@mui/material";

export default function MobileActionBar({ primaryAction, secondaryAction, children }) {
  return (
    <Stack spacing={1.5}>
      {(primaryAction || secondaryAction) && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {primaryAction && (
            <Button
              variant="contained"
              startIcon={primaryAction.icon}
              onClick={primaryAction.onClick}
              fullWidth={!secondaryAction}
              sx={{ minHeight: 46, flex: secondaryAction ? 1 : undefined }}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outlined"
              startIcon={secondaryAction.icon}
              onClick={secondaryAction.onClick}
              sx={{ minHeight: 46, flex: 1 }}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Box>
      )}
      {children}
    </Stack>
  );
}
