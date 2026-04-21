import { Box, Stack, Typography } from "@mui/material";
import MobileCard from "./MobileCard";

export default function MobileStatCard({ title, value, helper, icon: Icon, color = "primary.main" }) {
  return (
    <MobileCard
      sx={{
        background: `linear-gradient(135deg, ${color} 0%, rgba(255,255,255,0.96) 100%)`,
      }}
      contentSx={{ backgroundColor: "rgba(255,255,255,0.86)", backdropFilter: "blur(8px)" }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {value}
          </Typography>
          {helper && (
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          )}
        </Stack>

        {Icon && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              color: "common.white",
              backgroundColor: color,
              flexShrink: 0,
            }}
          >
            <Icon size={22} />
          </Box>
        )}
      </Box>
    </MobileCard>
  );
}
