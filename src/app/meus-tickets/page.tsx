'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/tickets');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar tickets');
        }

        setTickets(data.tickets || []);
      } catch (err) {
        setError('Falha ao carregar tickets. Por favor, tente novamente.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'aberto':
        return 'bg-blue-100 text-blue-800';
      case 'em_andamento':
        return 'bg-yellow-100 text-yellow-800';
      case 'aguardando_material':
        return 'bg-purple-100 text-purple-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'aberto':
        return 'Aberto';
      case 'em_andamento':
        return 'Em Andamento';
      case 'aguardando_material':
        return 'Aguardando Material';
      case 'concluido':
        return 'Concluído';
      default:
        return status;
    }
  };

  return (
    <AuthGuard allowedRoles={['solicitante']}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Meus Tickets</h1>
          <Link
            href="/tickets/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Abrir Novo Ticket
          </Link>
        </div>
        
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('aberto')}
              className={`px-4 py-2 rounded-md ${
                filter === 'aberto' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              Abertos
            </button>
            <button
              onClick={() => setFilter('em_andamento')}
              className={`px-4 py-2 rounded-md ${
                filter === 'em_andamento' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              Em Andamento
            </button>
            <button
              onClick={() => setFilter('aguardando_material')}
              className={`px-4 py-2 rounded-md ${
                filter === 'aguardando_material' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              Aguardando Material
            </button>
            <button
              onClick={() => setFilter('concluido')}
              className={`px-4 py-2 rounded-md ${
                filter === 'concluido' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              Concluídos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-gray-100 p-6 rounded-md text-center">
            <p className="text-gray-600">Nenhum ticket encontrado.</p>
            <p className="mt-2">
              <Link
                href="/tickets/new"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clique aqui para abrir um novo ticket
              </Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">#</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Local</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Unidade</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Setor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Data de Abertura</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{ticket.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{ticket.exact_location}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{ticket.unit_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{ticket.sector_name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(ticket.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Visualizar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
