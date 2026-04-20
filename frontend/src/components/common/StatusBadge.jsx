import { Chip } from "@mui/material";

const statusConfig = {
  ATIVO: { label: "Ativo", color: "success" },
  INATIVO: { label: "Inativo", color: "default" },
  BLOQUEADO: { label: "Bloqueado", color: "error" },
  PENDENTE: { label: "Pendente", color: "warning" },
  CONCLUIDO: { label: "Concluído", color: "success" },
  CANCELADO: { label: "Cancelado", color: "error" },
  CANCELADA: { label: "Cancelada", color: "error" },
  EM_ANDAMENTO: { label: "Em andamento", color: "info" },
  NAO_LIDA: { label: "Não lida", color: "warning" },
  LIDA: { label: "Lida", color: "default" },
  ARQUIVADA: { label: "Arquivada", color: "default" },
  BAIXA: { label: "Baixa", color: "default" },
  MEDIA: { label: "Média", color: "info" },
  ALTA: { label: "Alta", color: "warning" },
  CRITICA: { label: "Crítica", color: "error" },
  // Financeiro
  EM_ABERTO: { label: "Em aberto", color: "warning" },
  PAGO: { label: "Pago", color: "success" },
  PAGO_PARCIALMENTE: { label: "Pago parcial", color: "info" },
  VENCIDO: { label: "Vencido", color: "error" },
  // Vendas
  CONFIRMADA: { label: "Confirmada", color: "info" },
  FATURADA: { label: "Faturada", color: "success" },
  // Tipos de venda
  NORMAL: { label: "Normal", color: "default" },
  FUTURA: { label: "Futura", color: "info" },
  DIRETA: { label: "Direta", color: "success" },
};

export default function StatusBadge({ status, size = "small" }) {
  const config = statusConfig[status] || {
    label: status || "—",
    color: "default",
  };

  return <Chip label={config.label} color={config.color} size={size} />;
}
