import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getUser } from '@/lib/auth/auth';

// Tipo para tickets
export type Ticket = {
  id: number;
  requester_name: string;
  unit_id: number;
  sector_id: number;
  exact_location: string;
  points_quantity: number;
  responsible_user: string;
  observations?: string;
  status: 'aberto' | 'em_andamento' | 'aguardando_material' | 'concluido';
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  created_by: number;
};

// GET - Listar todos os tickets
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { DB } = getCloudflareContext();
    let query = '';
    
    // Filtrar tickets com base no papel do usuário
    if (user.role === 'solicitante') {
      // Solicitantes só veem seus próprios tickets
      query = `
        SELECT t.*, u.name as unit_name, s.name as sector_name, 
               tech.name as assigned_to_name
        FROM tickets t
        JOIN units u ON t.unit_id = u.id
        JOIN sectors s ON t.sector_id = s.id
        LEFT JOIN users tech ON t.assigned_to = tech.id
        WHERE t.created_by = ?
        ORDER BY t.created_at DESC
      `;
      
      const { results } = await DB.prepare(query).bind(user.id).all();
      return NextResponse.json({ tickets: results });
    } else {
      // Admins e técnicos veem todos os tickets
      query = `
        SELECT t.*, u.name as unit_name, s.name as sector_name, 
               tech.name as assigned_to_name, creator.name as creator_name
        FROM tickets t
        JOIN units u ON t.unit_id = u.id
        JOIN sectors s ON t.sector_id = s.id
        JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users tech ON t.assigned_to = tech.id
        ORDER BY t.created_at DESC
      `;
      
      const { results } = await DB.prepare(query).all();
      return NextResponse.json({ tickets: results });
    }
  } catch (error) {
    console.error('Erro ao listar tickets:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// POST - Criar novo ticket
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { 
      requester_name, 
      unit_id, 
      sector_id, 
      exact_location, 
      points_quantity, 
      responsible_user, 
      observations 
    } = body;
    
    // Validar campos obrigatórios
    if (!requester_name || !unit_id || !sector_id || !exact_location || !points_quantity || !responsible_user) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      );
    }
    
    const { DB } = getCloudflareContext();
    
    // Inserir novo ticket
    const result = await DB.prepare(`
      INSERT INTO tickets (
        requester_name, 
        unit_id, 
        sector_id, 
        exact_location, 
        points_quantity, 
        responsible_user, 
        observations, 
        status, 
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'aberto', ?)
      RETURNING id
    `).bind(
      requester_name,
      unit_id,
      sector_id,
      exact_location,
      points_quantity,
      responsible_user,
      observations || null,
      user.id
    ).run();
    
    // Registrar no histórico de status
    if (result.results && result.results.length > 0) {
      const ticketId = result.results[0].id;
      
      await DB.prepare(`
        INSERT INTO status_history (
          ticket_id, 
          old_status, 
          new_status, 
          changed_by
        ) VALUES (?, NULL, 'aberto', ?)
      `).bind(ticketId, user.id).run();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Ticket criado com sucesso',
        ticket_id: ticketId
      });
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar ticket' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
