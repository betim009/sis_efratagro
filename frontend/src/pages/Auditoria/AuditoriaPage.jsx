import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { MdSecurity } from "react-icons/md";

export default function AuditoriaPage() {
  return (
    <>
      <PageHeader title="Auditoria" subtitle="Logs de auditoria do sistema" />
      <EmptyState
        icon={MdSecurity}
        title="Módulo de auditoria"
        description="Consulta de logs de auditoria e rastreamento de ações serão implementados aqui."
      />
    </>
  );
}
