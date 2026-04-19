import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
} from "@mui/material";
import Loading from "./Loading";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  page = 0,
  rowsPerPage = 25,
  total = 0,
  onPageChange,
  onRowsPerPageChange,
  emptyMessage = "Nenhum registro encontrado",
}) {
  if (loading) return <Loading />;

  if (!rows.length) return <EmptyState title={emptyMessage} />;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.field}
                  sx={{ fontWeight: 600, whiteSpace: "nowrap", ...(col.headerSx || {}) }}
                  align={col.align || "left"}
                >
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow
                key={row.id || rowIndex}
                hover
                sx={{ "&:last-child td": { borderBottom: 0 } }}
              >
                {columns.map((col) => (
                  <TableCell key={col.field} align={col.align || "left"}>
                    {col.renderCell
                      ? col.renderCell(row)
                      : row[col.field] ?? "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {onPageChange && (
        <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={onPageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Itens por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </Box>
      )}
    </Paper>
  );
}
