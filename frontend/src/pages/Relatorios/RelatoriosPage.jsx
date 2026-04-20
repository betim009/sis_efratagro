import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { MdAssessment } from "react-icons/md";

export default function RelatoriosPage() {
  return (
    <>
      <PageHeader title="Relatórios" subtitle="Geração de relatórios e exportações" />
      <EmptyState
        icon={MdAssessment}
        title="Módulo de relatórios"
        description="Relatórios de vendas, financeiro, estoque e exportações serão implementados aqui."
      />
    </>
  );
}
