import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
} from "@mui/material";
import { MdSearch, MdFilterList, MdClear } from "react-icons/md";

export default function FilterToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters = [],
  onClear,
  actions,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        mb: 3,
        alignItems: "center",
      }}
    >
      {onSearchChange && (
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch size={20} />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      {filters.map((filter) => (
        <TextField
          key={filter.name}
          select
          size="small"
          label={filter.label}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          sx={{ minWidth: filter.minWidth || 160 }}
        >
          <MenuItem value="">
            <em>Todos</em>
          </MenuItem>
          {filter.options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      ))}

      {onClear && (
        <Button
          size="small"
          startIcon={<MdClear size={18} />}
          onClick={onClear}
          sx={{ color: "text.secondary" }}
        >
          Limpar
        </Button>
      )}

      {actions && (
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>{actions}</Box>
      )}
    </Box>
  );
}
