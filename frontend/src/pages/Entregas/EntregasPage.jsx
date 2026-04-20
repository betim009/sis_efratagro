import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { MdLocalShipping } from "react-icons/md";

export default function EntregasPage() {
  return (
    <>
      <PageHeader title="Entregas" subtitle="Controle de entregas e rastreamento" />
      <EmptyState
        icon={MdLocalShipping}
        title="Módulo de entregas"
        description="Registro de entregas, acompanhamento de status e rotas serão implementados aqui."
      />
    </>
  );
}
