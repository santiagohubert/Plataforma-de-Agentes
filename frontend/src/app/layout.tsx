import '../styles/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ALBIO - Agente de Bioenergética | SENS Desarrollo Humano',
  description: 'Espacio de estudio y profundización del Análisis Bioenergético de Alexander Lowen impulsado por inteligencia artificial.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
