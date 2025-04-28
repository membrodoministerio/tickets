import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getUser } from '@/lib/auth/auth';

// GET - Obter estatísticas e relatórios
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Apenas administradores e técnicos podem acessar relatórios
    if (user.role === 'solicitante') {
      return NextResponse.json(
        { error: 'Não autorizado a acessar relatórios' },
        { status: 403 }
      );
    }
    
    const { DB } = getCloudflareContext();
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'summary';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    let dateFilter = '';
    let dateParams = [];
    
    if (startDate && endDate) {
      dateFilter = 'AND t.created_at BETWEEN ? AND ?';
      dateParams = [startDate, endDate];
    } else if (startDate) {
      dateFilter = 'AND t.created_at >= ?';
      dateParams = [startDate];
    } else if (endDate) {
      dateFilter = 'AND t.created_at <= ?';
      dateParams = [endDate];
    }
    
    let results;
    
    switch (reportType) {
      case 'summary':
        // Resumo geral de tickets
        const summaryQuery = `
          SELECT
            COUNT(*) as total_tickets,
            SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as open_tickets,
            SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as in_progress_tickets,
            SUM(CASE WHEN status = 'aguardando_material' THEN 1 ELSE 0 END) as waiting_material_tickets,
            SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as completed_tickets,
            AVG(CASE 
              WHEN status = 'concluido' AND completed_at IS NOT NULL 
              THEN JULIANDAY(completed_at) - JULIANDAY(created_at) 
              ELSE NULL 
            END) as avg_resolution_days
          FROM tickets t
          WHERE 1=1 ${dateFilter}
        `;
        
        results = await DB.prepare(summaryQuery).bind(...dateParams).all();
        break;
        
      case 'by_unit':
        // Tickets por unidade
        const unitQuery = `
          SELECT 
            u.name as unit_name,
            COUNT(*) as total_tickets,
            SUM(CASE WHEN t.status = 'concluido' THEN 1 ELSE 0 END) as completed_tickets,
            SUM(CASE WHEN t.status != 'concluido' THEN 1 ELSE 0 END) as pending_tickets
          FROM tickets t
          JOIN units u ON t.unit_id = u.id
          WHERE 1=1 ${dateFilter}
          GROUP BY t.unit_id
          ORDER BY total_tickets DESC
        `;
        
        results = await DB.prepare(unitQuery).bind(...dateParams).all();
        break;
        
      case 'by_sector':
        // Tickets por setor
        const sectorQuery = `
          SELECT 
            s.name as sector_name,
            u.name as unit_name,
            COUNT(*) as total_tickets,
            SUM(CASE WHEN t.status = 'concluido' THEN 1 ELSE 0 END) as completed_tickets,
            SUM(CASE WHEN t.status != 'concluido' THEN 1 ELSE 0 END) as pending_tickets
          FROM tickets t
          JOIN sectors s ON t.sector_id = s.id
          JOIN units u ON t.unit_id = u.id
          WHERE 1=1 ${dateFilter}
          GROUP BY t.sector_id
          ORDER BY total_tickets DESC
        `;
        
        results = await DB.prepare(sectorQuery).bind(...dateParams).all();
        break;
        
      case 'by_technician':
        // Tickets por técnico
        const technicianQuery = `
          SELECT 
            u.name as technician_name,
            COUNT(*) as total_tickets,
            SUM(CASE WHEN t.status = 'concluido' THEN 1 ELSE 0 END) as completed_tickets,
            SUM(CASE WHEN t.status != 'concluido' THEN 1 ELSE 0 END) as pending_tickets,
            AVG(CASE 
              WHEN t.status = 'concluido' AND t.completed_at IS NOT NULL 
              THEN JULIANDAY(t.completed_at) - JULIANDAY(t.created_at) 
              ELSE NULL 
            END) as avg_resolution_days
          FROM tickets t
          JOIN users u ON t.assigned_to = u.id
          WHERE t.assigned_to IS NOT NULL ${dateFilter}
          GROUP BY t.assigned_to
          ORDER BY total_tickets DESC
        `;
        
        results = await DB.prepare(technicianQuery).bind(...dateParams).all();
        break;
        
      case 'monthly':
        // Estatísticas mensais
        const monthlyQuery = `
          SELECT 
            strftime('%Y-%m', t.created_at) as month,
            COUNT(*) as total_tickets,
            SUM(CASE WHEN t.status = 'concluido' THEN 1 ELSE 0 END) as completed_tickets,
            AVG(CASE 
              WHEN t.status = 'concluido' AND t.completed_at IS NOT NULL 
              THEN JULIANDAY(t.completed_at) - JULIANDAY(t.created_at) 
              ELSE NULL 
            END) as avg_resolution_days
          FROM tickets t
          WHERE 1=1 ${dateFilter}
          GROUP BY strftime('%Y-%m', t.created_at)
          ORDER BY month DESC
        `;
        
        results = await DB.prepare(monthlyQuery).bind(...dateParams).all();
        break;
        
      default:
        return NextResponse.json(
          { error: 'Tipo de relatório inválido' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      report_type: reportType,
      start_date: startDate,
      end_date: endDate,
      data: results.results
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
