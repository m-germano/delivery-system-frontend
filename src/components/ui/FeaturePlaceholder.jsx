import Alert from './Alert.jsx';
import EmptyState from './EmptyState.jsx';
import PageHeader from './PageHeader.jsx';

export default function FeaturePlaceholder({ title, description, endpoint, children }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      {endpoint ? (
        <Alert variant="warning" title="Integração preparada">
          Service do frontend já está previsto para <strong>{endpoint}</strong>. Quando a rota existir no backend, a tela pode passar a buscar dados reais.
        </Alert>
      ) : null}
      {children ?? (
        <EmptyState
          title="Tela estrutural pronta"
          description="A interface base, proteção por role e service de API já foram preparados. Falta apenas conectar os dados reais conforme os próximos módulos do backend forem implementados."
        />
      )}
    </div>
  );
}
