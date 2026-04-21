import { Box, Chip, Divider, IconButton, Stack, Typography } from "@mui/material";
import MobileCard from "./MobileCard";

export default function MobileListItem({
  title,
  subtitle,
  meta,
  chips = [],
  details = [],
  actions,
  onClick,
}) {
  return (
    <MobileCard
      sx={{
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          {meta && (
            <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
              {meta}
            </Typography>
          )}
        </Box>

        {chips.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {chips.map((chip) => (
              <Chip
                key={`${chip.label}-${chip.color || "default"}`}
                label={chip.label}
                color={chip.color || "default"}
                size="small"
                variant={chip.variant || "outlined"}
              />
            ))}
          </Box>
        )}

        {details.length > 0 && (
          <>
            <Divider />
            <Stack spacing={0.75}>
              {details.map((detail) => (
                <Box key={detail.label} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {detail.label}
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: "right", fontWeight: detail.emphasis ? 700 : 500 }}>
                    {detail.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}

        {actions && (
          <>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
              {actions.map((action) => (
                <IconButton
                  key={action.label}
                  aria-label={action.label}
                  color={action.color || "default"}
                  onClick={(event) => {
                    event.stopPropagation();
                    action.onClick?.();
                  }}
                  sx={{ width: 44, height: 44 }}
                >
                  {action.icon}
                </IconButton>
              ))}
            </Box>
          </>
        )}
      </Stack>
    </MobileCard>
  );
}
