import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { MdBlock, MdEdit, MdInfo } from "react-icons/md";
import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";

export default function FornecedorTable({
  rows,
  loading,
  page,
  rowsPerPage,
  total,
  canUpdate,
  canInactivate,
  onPageChange,
  onRowsPerPageChange,
  onViewDetails,
  onEdit,
  onInactivate,
}) {
  const columns = [
    {
      field: "razao_social",
      headerName: "Fornecedor",
      renderCell: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.razao_social}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.nome_fantasia || "Sem nome fantasia"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "cnpj_cpf",
      headerName: "CNPJ / CPF",
      renderCell: (row) => row.cnpj_cpf || "—",
    },
    {
      field: "contato",
      headerName: "Contato",
      renderCell: (row) => (
        <Box>
          <Typography variant="body2">{row.contato_responsavel || "—"}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.telefone || row.email || "Sem contato principal"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      field: "acoes",
      headerName: "Ações",
      align: "right",
      renderCell: (row) => (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
          <Tooltip title="Ver detalhes">
            <IconButton size="small" onClick={() => onViewDetails(row)}>
              <MdInfo size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar fornecedor">
            <span>
              <IconButton size="small" onClick={() => onEdit(row)} disabled={!canUpdate}>
                <MdEdit size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={row.status === "INATIVO" ? "Fornecedor já inativo" : "Inativar fornecedor"}>
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={() => onInactivate(row)}
                disabled={!canInactivate || row.status === "INATIVO"}
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
      emptyMessage="Nenhum fornecedor encontrado"
    />
  );
}
