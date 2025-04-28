'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';

export default function Layout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();

        if (!response.ok || !data.authenticated) {
          router.push('/login');
          return;
        }

        setUser(data.user);
        fetchUnreadNotifications();
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/unread');
      const data = await response.json();

      if (response.ok) {
        setUnreadNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notification_id: notificationId })
      });

      // Atualizar lista de notificações
      setUnreadNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-900"></div>
          <p className="mt-2 text-gray-700">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="navbar shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href={user?.role === 'solicitante' ? '/meus-tickets' : '/dashboard'} className="flex items-center">
                <Logo size="small" />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notificações */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative rounded-full p-1 text-white hover:bg-blue-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="p-2">
                      <h3 className="text-sm font-medium text-gray-900 p-2">Notificações</h3>
                      <div className="max-h-60 overflow-y-auto">
                        {unreadNotifications.length === 0 ? (
                          <p className="p-2 text-sm text-gray-500">Nenhuma notificação não lida.</p>
                        ) : (
                          unreadNotifications.map((notification) => (
                            <div key={notification.id} className="border-b border-gray-100 p-2">
                              <div className="flex justify-between">
                                <Link 
                                  href={`/tickets/${notification.ticket_id}`}
                                  className="text-sm font-medium text-blue-900 hover:text-blue-700"
                                  onClick={() => {
                                    markNotificationAsRead(notification.id);
                                    setShowNotifications(false);
                                  }}
                                >
                                  Ticket #{notification.ticket_id}
                                </Link>
                                <button
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Marcar como lida
                                </button>
                              </div>
                              <p className="text-xs text-gray-600">{notification.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(notification.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="border-t border-gray-100 p-2">
                        <Link
                          href="/notifications"
                          className="block text-center text-xs text-blue-900 hover:text-blue-700"
                          onClick={() => setShowNotifications(false)}
                        >
                          Ver todas as notificações
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu do usuário */}
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-white">
                    {user?.name} ({user?.role === 'admin' ? 'Administrador' : user?.role === 'tecnico' ? 'Técnico' : 'Solicitante'})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="rounded-md bg-white px-3 py-1 text-sm text-blue-900 hover:bg-blue-50"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar e conteúdo principal */}
      <div className="container mx-auto flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="sidebar w-full md:w-64 p-4 shadow-sm">
          <nav className="space-y-1">
            {user?.role === 'solicitante' ? (
              <>
                <Link
                  href="/meus-tickets"
                  className="sidebar-link block rounded-md px-3 py-2 text-sm font-medium"
                >
                  Meus Tickets
                </Link>
                <Link
                  href="/tickets/new"
                  className="sidebar-link block rounded-md px-3 py-2 text-sm font-medium"
                >
                  Abrir Novo Ticket
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="sidebar-link block rounded-md px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/tickets/new"
                  className="sidebar-link block rounded-md px-3 py-2 text-sm font-medium"
                >
                  Abrir Novo Ticket
                </Link>
                <Link
                  href="/reports"
                  className="sidebar-link block rounded-md px-3 py-2 text-sm font-medium"
                >
                  Relatórios
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
