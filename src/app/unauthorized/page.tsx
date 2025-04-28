'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Não Autorizado</h1>
        <p className="text-gray-700 mb-6">
          Você não tem permissão para acessar esta página. Por favor, entre em contato com o administrador se acredita que isso é um erro.
        </p>
        <div className="flex justify-center space-x-4">
          <Link 
            href="/login" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar para Login
          </Link>
        </div>
      </div>
    </div>
  );
}
