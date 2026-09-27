import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Arias · Sombreros y gorras al por mayor', template: '%s | Arias' },
  description: 'Sombreros y gorras por media docena, docena o caja. Arma tu pedido y conversemos por WhatsApp.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body className="flex min-h-screen flex-col"><a href="#contenido" className="skip-link">Saltar al contenido</a>{children}</body></html>;
}
