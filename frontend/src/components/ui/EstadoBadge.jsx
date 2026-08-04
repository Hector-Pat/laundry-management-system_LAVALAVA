import { ORDER_STATUS_LABELS } from '../../constants/orderStatus'

// CANCELADO no es un status de pedido real (el backend lo modela como
// pedido.cancelledAt sobre cualquier status), asi que su etiqueta vive aqui
// y no en ORDER_STATUS_LABELS: agregarlo alli lo expondria como opcion de
// filtro en los selects que reusan esa constante.
const STATUS_LABELS = { ...ORDER_STATUS_LABELS, CANCELADO: 'Cancelado' }

const STATUS_STYLES = {
  RECIBIDO: 'bg-ink/8 text-ink/60',
  LAVADO: 'bg-tag/10 text-tag',
  SECADO: 'bg-tag/10 text-tag',
  PLANCHADO: 'bg-tag/10 text-tag',
  LISTO: 'bg-detergent/10 text-detergent',
  ENTREGADO: 'bg-sage/10 text-sage',
  CANCELADO: 'bg-danger/10 text-danger',
}

const SIZE_STYLES = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
}

function EstadoBadge({ status, size = 'sm' }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.RECIBIDO
  const label = STATUS_LABELS[status] || status

  return (
    <span className={`inline-flex rounded-full font-semibold ${SIZE_STYLES[size]} ${style}`}>
      {label}
    </span>
  )
}

export default EstadoBadge
