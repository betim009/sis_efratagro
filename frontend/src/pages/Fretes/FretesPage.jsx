import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { MdReceipt } from "react-icons/md";

export default function FretesPage() {
  return (
    <>
      <PageHeader title="Fretes" subtitle="Cálculo e gerenciamento de fretes" />
      <EmptyState
        icon={MdReceipt}
        title="Módulo de fretes"
        description="Cálculo de fretes, tabelas de preço e histórico serão implementados aqui."
      />
    </>
  );
}
