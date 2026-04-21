import { Card, CardContent } from "@mui/material";

export default function MobileCard({ children, sx, contentSx, ...props }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 10px 24px rgba(16, 24, 40, 0.06)",
        ...sx,
      }}
      {...props}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, ...contentSx }}>{children}</CardContent>
    </Card>
  );
}
