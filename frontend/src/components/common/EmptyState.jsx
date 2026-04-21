import { createElement } from "react";
import { Box, Typography } from "@mui/material";
import { MdInbox } from "react-icons/md";

export default function EmptyState({
  icon: Icon = MdInbox,
  title = "Nenhum registro encontrado",
  description = "",
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        gap: 1.5,
      }}
    >
      {createElement(Icon, { size: 56, color: "#BDBDBD" })}
      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
    </Box>
  );
}
