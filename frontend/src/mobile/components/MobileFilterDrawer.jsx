import {
  Box,
  Button,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdClose } from "react-icons/md";

export default function MobileFilterDrawer({
  open,
  title = "Filtros",
  onClose,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters = [],
  onClear,
}) {
  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box
        sx={{
          p: 2,
          pb: 4,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: "82vh",
          overflowY: "auto",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 700 }}>
            {title}
          </Typography>
          <IconButton onClick={onClose} sx={{ width: 42, height: 42 }}>
            <MdClose size={20} />
          </IconButton>
        </Box>

        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Busca"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />

          {filters.map((filter) => (
            <TextField
              key={filter.name}
              select
              fullWidth
              label={filter.label}
              value={filter.value}
              onChange={(event) => filter.onChange?.(event.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {filter.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          ))}

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" fullWidth onClick={onClear} sx={{ minHeight: 46 }}>
              Limpar
            </Button>
            <Button variant="contained" fullWidth onClick={onClose} sx={{ minHeight: 46 }}>
              Aplicar
            </Button>
          </Box>
        </Stack>
      </Box>
    </Drawer>
  );
}
