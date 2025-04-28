'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Componente de middleware para proteção de rotas
export default function AuthGuard({
  children,
  allowedRoles = [],
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();

        if (!response.ok || !data.authenticated) {
          router.push('/login');
          return;
        }

        // Verificar se o usuário tem o papel necessário
        if (allowedRoles.length > 0 && !allowedRoles.includes(data.user.role)) {
          router.push('/unauthorized');
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          <p className="mt-2 text-gray-700">Carregando...</p>
        </div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}
