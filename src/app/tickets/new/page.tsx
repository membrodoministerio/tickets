'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';

export default function NewTicketPage() {
  const router = useRouter();
  const [units, setUnits] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    requester_name: '',
    unit_id: '',
    sector_id: '',
    exact_location: '',
    points_quantity: 1,
    responsible_user: '',
    observations: ''
  });

  // Buscar unidades ao carregar a página
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar unidades');
        }
        
        setUnits(data.units || []);
      } catch (err) {
        setError('Falha ao carregar unidades. Por favor, tente novamente.');
        console.error(err);
      }
    };
    
    fetchUnits();
  }, []);
  
  // Buscar setores quando uma unidade for selecionada
  useEffect(() => {
    if (!selectedUnit) {
      setSectors([]);
      return;
    }
    
    const fetchSectors = async () => {
      try {
        const response = await fetch(`/api/units/${selectedUnit}/sectors`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar setores');
        }
        
        setSectors(data.sectors || []);
      } catch (err) {
        setError('Falha ao carregar setores. Por favor, tente novamente.');
        console.error(err);
      }
    };
    
    fetchSectors();
  }, [selectedUnit]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'unit_id') {
      setSelectedUnit(value);
      setFormData({
        ...formData,
        unit_id: value,
        sector_id: '' // Resetar setor quando a unidade mudar
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar ticket');
      }
      
      setSuccess(true);
      
      // Redirecionar para a página do ticket após 2 segundos
      setTimeout(() => {
        router.push(`/tickets/${data.ticket_id}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao criar o ticket');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Abrir Novo Ticket</h1>
        
        {error && (
          <div className="mb-4 bg-red-100 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-100 text-green-700 p-4 rounded-md">
            Ticket criado com sucesso! Redirecionando...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="requester_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Solicitante *
              </label>
              <input
                type="text"
                id="requester_name"
                name="requester_name"
                value={formData.requester_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="unit_id" className="block text-sm font-medium text-gray-700 mb-1">
                Unidade *
              </label>
              <select
                id="unit_id"
                name="unit_id"
                value={formData.unit_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma unidade</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="sector_id" className="block text-sm font-medium text-gray-700 mb-1">
                Setor *
              </label>
              <select
                id="sector_id"
                name="sector_id"
                value={formData.sector_id}
                onChange={handleChange}
                required
                disabled={!selectedUnit}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione um setor</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="exact_location" className="block text-sm font-medium text-gray-700 mb-1">
                Local Exato do Ponto *
              </label>
              <input
                type="text"
                id="exact_location"
                name="exact_location"
                value={formData.exact_location}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="points_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade de Pontos *
              </label>
              <input
                type="number"
                id="points_quantity"
                name="points_quantity"
                value={formData.points_quantity}
                onChange={handleChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="responsible_user" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Usuário Responsável *
              </label>
              <input
                type="text"
                id="responsible_user"
                name="responsible_user"
                value={formData.responsible_user}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              id="observations"
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Abrir Ticket'}
            </button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
