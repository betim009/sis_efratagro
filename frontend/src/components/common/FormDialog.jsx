import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from "@mui/material";
import { MdClose } from "react-icons/md";

export default function FormDialog({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitText = "Salvar",
  cancelText = "Cancelar",
  loading = false,
  maxWidth = "sm",
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{
        paper: {
          component: "form",
          onSubmit: handleSubmit,
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {title}
        <IconButton onClick={onClose} disabled={loading} size="small">
          <MdClose size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Salvando..." : submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
