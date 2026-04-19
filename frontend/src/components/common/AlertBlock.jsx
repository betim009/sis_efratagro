import { Card, CardContent, Box, Typography, Chip } from "@mui/material";
import { MdWarning, MdError, MdInfo } from "react-icons/md";

const severityConfig = {
  warning: { icon: MdWarning, color: "#ED6C02", bg: "#FFF3E0", chipColor: "warning" },
  error: { icon: MdError, color: "#D32F2F", bg: "#FFEBEE", chipColor: "error" },
  info: { icon: MdInfo, color: "#0288D1", bg: "#E3F2FD", chipColor: "info" },
};

export default function AlertBlock({ title, items = [], severity = "warning" }) {
  const config = severityConfig[severity] || severityConfig.warning;
  const Icon = config.icon;

  if (!items.length) return null;

  return (
    <Card sx={{ borderLeft: `4px solid ${config.color}`, backgroundColor: config.bg }}>
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Icon size={20} color={config.color} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Chip label={items.length} size="small" color={config.chipColor} sx={{ ml: "auto", height: 22 }} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {items.slice(0, 5).map((item, i) => (
            <Typography key={i} variant="body2" color="text.secondary">
              • {item}
            </Typography>
          ))}
          {items.length > 5 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              ... e mais {items.length - 5} alerta(s)
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
