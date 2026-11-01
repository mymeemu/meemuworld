import React from 'react';

export const metadata = {
  title: 'MEEMU World - Jogo Espacial 3D',
  description: 'Jogo de sobrevivência e exploração espacial FPS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#020208' }}>
        {children}
      </body>
    </html>
  );
}
