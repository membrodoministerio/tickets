import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getUser } from '@/lib/auth/auth';

// GET - Obter estatísticas básicas para o dashboard
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Apenas administradores e técnicos podem acessar estatísticas
    if (user.role === 'solicitante') {
      return NextResponse.json(
        { error: 'Não autorizado a acessar estatísticas' },
        { status: 403 }
      );
    }
    
    const { DB } = getCloudflareContext();
    
    // Estatísticas gerais
    const statsQuery = `
      SELECT
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN status = 'aguardando_material' THEN 1 ELSE 0 END) as waiting_material_tickets,
        SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as completed_tickets
      FROM tickets
    `;
    
    const statsResult = await DB.prepare(statsQuery).all();
    
    // Tickets recentes
    const recentTicketsQuery = `
      SELECT t.*, u.name as unit_name, s.name as sector_name, 
             tech.name as assigned_to_name
      FROM tickets t
      JOIN units u ON t.unit_id = u.id
      JOIN sectors s ON t.sector_id = s.id
      LEFT JOIN users tech ON t.assigned_to = tech.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `;
    
    const recentTicketsResult = await DB.prepare(recentTicketsQuery).all();
    
    // Tickets por unidade
    const unitStatsQuery = `
      SELECT u.name as unit_name, COUNT(*) as ticket_count
      FROM tickets t
      JOIN units u ON t.unit_id = u.id
      GROUP BY t.unit_id
      ORDER BY ticket_count DESC
      LIMIT 5
    `;
    
    const unitStatsResult = await DB.prepare(unitStatsQuery).all();
    
    return NextResponse.json({
      stats: statsResult.results[0],
      recent_tickets: recentTicketsResult.results,
      unit_stats: unitStatsResult.results
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
