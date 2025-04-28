import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getUser } from '@/lib/auth/auth';

// GET - Obter detalhes de um ticket específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const ticketId = parseInt(params.id);
    
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'ID de ticket inválido' },
        { status: 400 }
      );
    }
    
    const { DB } = getCloudflareContext();
    
    // Buscar detalhes do ticket
    const ticketQuery = `
      SELECT t.*, u.name as unit_name, s.name as sector_name, 
             tech.name as assigned_to_name, creator.name as creator_name
      FROM tickets t
      JOIN units u ON t.unit_id = u.id
      JOIN sectors s ON t.sector_id = s.id
      JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users tech ON t.assigned_to = tech.id
      WHERE t.id = ?
    `;
    
    const ticketResult = await DB.prepare(ticketQuery).bind(ticketId).all();
    
    if (ticketResult.results.length === 0) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }
    
    const ticket = ticketResult.results[0];
    
    // Verificar permissão para solicitantes
    if (user.role === 'solicitante' && ticket.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a visualizar este ticket' },
        { status: 403 }
      );
    }
    
    // Buscar comentários do ticket
    const commentsQuery = `
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `;
    
    const commentsResult = await DB.prepare(commentsQuery).bind(ticketId).all();
    
    // Buscar anexos do ticket
    const attachmentsQuery = `
      SELECT a.*, u.name as uploaded_by_name
      FROM attachments a
      JOIN users u ON a.uploaded_by = u.id
      WHERE a.ticket_id = ?
      ORDER BY a.created_at ASC
    `;
    
    const attachmentsResult = await DB.prepare(attachmentsQuery).bind(ticketId).all();
    
    // Buscar histórico de status
    const historyQuery = `
      SELECT h.*, u.name as changed_by_name
      FROM status_history h
      JOIN users u ON h.changed_by = u.id
      WHERE h.ticket_id = ?
      ORDER BY h.created_at ASC
    `;
    
    const historyResult = await DB.prepare(historyQuery).bind(ticketId).all();
    
    return NextResponse.json({
      ticket,
      comments: commentsResult.results,
      attachments: attachmentsResult.results,
      history: historyResult.results
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do ticket:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar ticket (status, atribuição, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Apenas técnicos e admins podem atualizar tickets
    if (user.role === 'solicitante') {
      return NextResponse.json(
        { error: 'Não autorizado a atualizar tickets' },
        { status: 403 }
      );
    }
    
    const ticketId = parseInt(params.id);
    
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'ID de ticket inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { status, assigned_to } = body;
    
    const { DB } = getCloudflareContext();
    
    // Verificar se o ticket existe
    const ticketCheck = await DB.prepare(`
      SELECT status FROM tickets WHERE id = ?
    `).bind(ticketId).all();
    
    if (ticketCheck.results.length === 0) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }
    
    const currentStatus = ticketCheck.results[0].status;
    let updates = [];
    let params = [];
    
    // Preparar atualizações
    if (status && status !== currentStatus) {
      updates.push('status = ?');
      params.push(status);
      
      // Se o status for 'concluido', definir completed_at
      if (status === 'concluido') {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      }
    }
    
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to);
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma atualização fornecida' },
        { status: 400 }
      );
    }
    
    // Adicionar updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    // Atualizar ticket
    const updateQuery = `
      UPDATE tickets
      SET ${updates.join(', ')}
      WHERE id = ?
    `;
    
    params.push(ticketId);
    await DB.prepare(updateQuery).bind(...params).run();
    
    // Registrar mudança de status no histórico
    if (status && status !== currentStatus) {
      await DB.prepare(`
        INSERT INTO status_history (
          ticket_id, 
          old_status, 
          new_status, 
          changed_by
        ) VALUES (?, ?, ?, ?)
      `).bind(ticketId, currentStatus, status, user.id).run();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Ticket atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar ticket:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
