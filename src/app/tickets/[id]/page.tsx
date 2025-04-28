'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id;
  
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Buscar detalhes do ticket
  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar detalhes do ticket');
        }
        
        setTicket(data.ticket);
        setComments(data.comments || []);
        setAttachments(data.attachments || []);
        setHistory(data.history || []);
      } catch (err) {
        setError('Falha ao carregar detalhes do ticket. Por favor, tente novamente.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);
  
  // Adicionar comentário
  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setCommentLoading(true);
    
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar comentário');
      }
      
      // Recarregar comentários
      const commentsResponse = await fetch(`/api/tickets/${ticketId}/comments`);
      const commentsData = await commentsResponse.json();
      
      if (commentsResponse.ok) {
        setComments(commentsData.comments || []);
      }
      
      setNewComment('');
    } catch (err) {
      setError('Falha ao adicionar comentário. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };
  
  // Atualizar status do ticket
  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar status');
      }
      
      // Recarregar detalhes do ticket
      const ticketResponse = await fetch(`/api/tickets/${ticketId}`);
      const ticketData = await ticketResponse.json();
      
      if (ticketResponse.ok) {
        setTicket(ticketData.ticket);
        setHistory(ticketData.history || []);
      }
    } catch (err) {
      setError('Falha ao atualizar status. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  };
  
  // Upload de arquivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!file) return;
    
    setUploadLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload do arquivo');
      }
      
      // Recarregar anexos
      const attachmentsResponse = await fetch(`/api/tickets/${ticketId}/attachments`);
      const attachmentsData = await attachmentsResponse.json();
      
      if (attachmentsResponse.ok) {
        setAttachments(attachmentsData.attachments || []);
      }
      
      setFile(null);
      // Limpar o input de arquivo
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError('Falha ao fazer upload do arquivo. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };
  
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
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };
  
  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-500"></div>
          </div>
        </div>
      </AuthGuard>
    );
  }
  
  if (error) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voltar para Dashboard
          </button>
        </div>
      </AuthGuard>
    );
  }
  
  if (!ticket) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 text-yellow-700 p-4 rounded-md">
            Ticket não encontrado ou você não tem permissão para visualizá-lo.
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voltar para Dashboard
          </button>
        </div>
      </AuthGuard>
    );
  }
  
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Ticket #{ticket.id} - {ticket.requester_name}
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Voltar para Dashboard
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-wrap justify-between mb-6">
              <div className="w-full md:w-1/2 mb-4 md:mb-0">
                <h2 className="text-lg font-semibold mb-4">Informações do Ticket</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status:</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data de Abertura:</p>
                    <p>{formatDate(ticket.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unidade:</p>
                    <p>{ticket.unit_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Setor:</p>
                    <p>{ticket.sector_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Local Exato:</p>
                    <p>{ticket.exact_location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quantidade de Pontos:</p>
                    <p>{ticket.points_quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Responsável:</p>
                    <p>{ticket.responsible_user}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Técnico Atribuído:</p>
                    <p>{ticket.assigned_to_name || 'Não atribuído'}</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-1/2">
                <h2 className="text-lg font-semibold mb-4">Observações</h2>
                <p className="bg-gray-50 p-4 rounded-md min-h-[100px]">
                  {ticket.observations || 'Nenhuma observação.'}
                </p>
              </div>
            </div>
            
            {/* Ações de Status (apenas para técnicos e admin) */}
            <div className="mt-6 border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Atualizar Status</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange('aberto')}
                  disabled={ticket.status === 'aberto' || statusLoading}
                  className={`px-4 py-2 rounded-md ${
                    ticket.status === 'aberto'
                      ? 'bg-blue-200 text-blue-800 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50`}
                >
                  Aberto
                </button>
                <button
                  onClick={() => handleStatusChange('em_andamento')}
                  disabled={ticket.status === 'em_andamento' || statusLoading}
                  className={`px-4 py-2 rounded-md ${
                    ticket.status === 'em_andamento'
                      ? 'bg-yellow-200 text-yellow-800 cursor-not-allowed'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  } disabled:opacity-50`}
                >
                  Em Andamento
                </button>
                <button
                  onClick={() => handleStatusChange('aguardando_material')}
                  disabled={ticket.status === 'aguardando_material' || statusLoading}
                  className={`px-4 py-2 rounded-md ${
                    ticket.status === 'aguardando_material'
                      ? 'bg-purple-200 text-purple-800 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  } disabled:opacity-50`}
                >
                  Aguardando Material
                </button>
                <button
                  onClick={() => handleStatusChange('concluido')}
                  disabled={ticket.status === 'concluido' || statusLoading}
                  className={`px-4 py-2 rounded-md ${
                    ticket.status === 'concluido'
                      ? 'bg-green-200 text-green-800 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } disabled:opacity-50`}
                >
                  Concluído
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Comentários */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Comentários</h2>
              
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-500 italic">Nenhum comentário ainda.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium">{comment.user_name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({comment.user_role === 'tecnico' ? 'Técnico' : 'Solicitante'})
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
              
              <form onSubmit={handleAddComment}>
                <div className="mb-4">
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                    Adicionar Comentário
                  </label>
                  <textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite seu comentário aqui..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={commentLoading || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {commentLoading ? 'Enviando...' : 'Enviar Comentário'}
                </button>
              </form>
            </div>
          </div>
          
          {/* Anexos e Histórico */}
          <div className="space-y-8">
            {/* Anexos */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Anexos</h2>
                
                <div className="space-y-2 mb-6 max-h-[200px] overflow-y-auto">
                  {attachments.length === 0 ? (
                    <p className="text-gray-500 italic">Nenhum anexo ainda.</p>
                  ) : (
                    attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium">{attachment.original_filename}</p>
                            <p className="text-xs text-gray-500">
                              {(attachment.size / 1024).toFixed(2)} KB • Enviado por {attachment.uploaded_by_name}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`/uploads/${attachment.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Download
                        </a>
                      </div>
                    ))
                  )}
                </div>
                
                <form onSubmit={handleFileUpload} className="mt-4">
                  <div className="mb-4">
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
                      Adicionar Anexo
                    </label>
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploadLoading || !file}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {uploadLoading ? 'Enviando...' : 'Enviar Arquivo'}
                  </button>
                </form>
              </div>
            </div>
            
            {/* Histórico de Status */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Histórico de Status</h2>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-gray-500 italic">Nenhum histórico disponível.</p>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3 p-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${getStatusClass(item.new_status)}`}></div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{getStatusText(item.new_status)}</span>
                            {item.old_status && (
                              <span className="text-gray-500">
                                {' '}
                                (anteriormente: {getStatusText(item.old_status)})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(item.created_at)} por {item.changed_by_name}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
