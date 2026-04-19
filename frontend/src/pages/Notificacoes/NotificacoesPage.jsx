import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { MdNotifications } from "react-icons/md";

export default function NotificacoesPage() {
  return (
    <>
      <PageHeader title="Notificações" subtitle="Central de notificações" />
      <EmptyState
        icon={MdNotifications}
        title="Módulo de notificações"
        description="Listagem, filtros e ações sobre notificações serão implementados aqui."
      />
    </>
  );
}
