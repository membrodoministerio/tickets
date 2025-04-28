'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';

export default function ReportsPage() {
  const router = useRouter();
  const [reportType, setReportType] = useState('summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let url = `/api/reports?type=${reportType}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar relatório');
      }

      setReportData(data);
    } catch (err) {
      setError('Falha ao gerar relatório. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderReportContent = () => {
    if (!reportData || !reportData.data) return null;

    switch (reportType) {
      case 'summary':
        return renderSummaryReport();
      case 'by_unit':
        return renderUnitReport();
      case 'by_sector':
        return renderSectorReport();
      case 'by_technician':
        return renderTechnicianReport();
      case 'monthly':
        return renderMonthlyReport();
      default:
        return <p>Tipo de relatório não suportado.</p>;
    }
  };

  const renderSummaryReport = () => {
    const data = reportData.data[0];
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Resumo Geral</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Total de Tickets</p>
            <p className="text-2xl font-bold">{data.total_tickets}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Tickets Abertos</p>
            <p className="text-2xl font-bold">{data.open_tickets}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Em Andamento</p>
            <p className="text-2xl font-bold">{data.in_progress_tickets}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Aguardando Material</p>
            <p className="text-2xl font-bold">{data.waiting_material_tickets}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Concluídos</p>
            <p className="text-2xl font-bold">{data.completed_tickets}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Tempo Médio de Resolução</p>
            <p className="text-2xl font-bold">
              {data.avg_resolution_days ? `${parseFloat(data.avg_resolution_days).toFixed(1)} dias` : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderUnitReport = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Tickets por Unidade</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concluídos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendentes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa de Conclusão</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.data.map((unit, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{unit.unit_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{unit.total_tickets}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{unit.completed_tickets}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{unit.pending_tickets}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {unit.total_tickets > 0
                      ? `${((unit.completed_tickets / unit.total_tickets) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSectorReport = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Tickets por Setor</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concluídos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendentes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.data.map((sector, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{sector.sector_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sector.unit_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sector.total_tickets}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sector.completed_tickets}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sector.pending_tickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTechnicianReport = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Tickets por Técnico</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Técnico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concluídos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendentes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo Médio (dias)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.data.map((tech, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{tech.technician_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tech.total_tickets}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tech.completed_tickets}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tech.pending_tickets}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tech.avg_resolution_days ? parseFloat(tech.avg_resolution_days).toFixed(1) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMonthlyReport = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Estatísticas Mensais</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total de Tickets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Concluídos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo Médio (dias)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.data.map((month, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{month.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{month.total_tickets}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{month.completed_tickets}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {month.avg_resolution_days ? parseFloat(month.avg_resolution_days).toFixed(1) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AuthGuard allowedRoles={['admin', 'tecnico']}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Relatórios e Estatísticas</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Voltar para Dashboard
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4">Gerar Relatório</h2>
          <form onSubmit={handleGenerateReport} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Relatório
                </label>
                <select
                  id="report-type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="summary">Resumo Geral</option>
                  <option value="by_unit">Por Unidade</option>
                  <option value="by_sector">Por Setor</option>
                  <option value="by_technician">Por Técnico</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Gerando...' : 'Gerar Relatório'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <h2 className="text-lg font-semibold mb-2">Informações do Relatório</h2>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Tipo:</span>{' '}
                {reportType === 'summary'
                  ? 'Resumo Geral'
                  : reportType === 'by_unit'
                  ? 'Por Unidade'
                  : reportType === 'by_sector'
                  ? 'Por Setor'
                  : reportType === 'by_technician'
                  ? 'Por Técnico'
                  : 'Mensal'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Período:</span>{' '}
                {startDate && endDate
                  ? `De ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`
                  : startDate
                  ? `A partir de ${new Date(startDate).toLocaleDateString('pt-BR')}`
                  : endDate
                  ? `Até ${new Date(endDate).toLocaleDateString('pt-BR')}`
                  : 'Todo o período'}
              </p>
            </div>
            {renderReportContent()}
          </div>
        ) : null}
      </div>
    </AuthGuard>
  );
}
