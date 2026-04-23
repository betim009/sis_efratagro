import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { MdBlock, MdEdit } from "react-icons/md";
import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";

export default function LocalEstoqueTable({
  rows,
  loading,
  page,
  rowsPerPage,
  total,
  canUpdate,
  onEdit,
  onInactivate,
  onPageChange,
  onRowsPerPageChange,
}) {
  const columns = [
    {
      field: "nome",
      headerName: "Local",
      renderCell: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.nome}
          </Typography>
          {row.codigo && (
            <Typography variant="caption" color="text.secondary">
              Código: {row.codigo}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "descricao",
      headerName: "Descrição",
      renderCell: (row) => row.descricao || "—",
    },
    {
      field: "status",
      headerName: "Status",
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      field: "actions",
      headerName: "Ações",
      align: "right",
      renderCell: (row) => (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
          <Tooltip title="Editar local">
            <span>
              <IconButton size="small" onClick={() => onEdit(row)} disabled={!canUpdate}>
                <MdEdit size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={row.status === "INATIVO" ? "Local já inativo" : "Inativar local"}>
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={() => onInactivate(row)}
                disabled={!canUpdate || row.status === "INATIVO"}
              >
                <MdBlock size={18} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      page={page}
      rowsPerPage={rowsPerPage}
      total={total}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      emptyMessage="Nenhum local de estoque encontrado"
    />
  );
}
