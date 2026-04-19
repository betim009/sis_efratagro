import { Card, CardContent, Box, Typography } from "@mui/material";

export default function StatCard({ title, value, icon: Icon, color = "primary.main" }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {Icon && (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${color}15`,
              color,
              flexShrink: 0,
            }}
          >
            <Icon size={24} />
          </Box>
        )}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.3 }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
