'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao fazer login');
      }

      // Redirecionar com base no papel do usuário
      if (data.user.role === 'solicitante') {
        router.push('/meus-tickets');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900 bg-opacity-10 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="large" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-blue-900">Sistema de Tickets</h2>
          <p className="mt-2 text-sm text-gray-600">
            Entre com suas credenciais para acessar o sistema
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-900 focus:border-blue-900 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-900 focus:border-blue-900 focus:z-10 sm:text-sm"
                placeholder="Senha"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              Credenciais de demonstração:
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <p className="font-semibold">Administrador:</p>
                <p>administrador@primeip.com.br</p>
                <p>Admin@2025</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="font-semibold">Técnico:</p>
                <p>tecnico1@primeip.com.br</p>
                <p>Tecnico@2025</p>
              </div>
              <div className="bg-gray-50 p-2 rounded col-span-2">
                <p className="font-semibold">Solicitante:</p>
                <p>solicitante1@primeip.com.br</p>
                <p>Solicitante@2025</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
