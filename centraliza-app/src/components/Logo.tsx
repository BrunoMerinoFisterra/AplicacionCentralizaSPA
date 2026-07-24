type Props = {
  size?: 'sm' | 'lg';
};

// Logo oficial de Centraliza. El archivo debe existir en public/logo-centraliza.png
// (incluye el wordmark, los puntos y el tagline — no se recrea nada por código).
export function Logo({ size = 'sm' }: Props) {
  return (
    <img
      className={`logo logo-${size}`}
      src="/logo-centraliza.png"
      alt="Centraliza — Optimizamos tu proceso de compra"
    />
  );
}
