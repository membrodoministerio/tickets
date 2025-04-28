import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getUser } from '@/lib/auth/auth';

// POST - Adicionar comentário a um ticket
export async function POST(
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
    
    const body = await request.json();
    const { content } = body;
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'O conteúdo do comentário é obrigatório' },
        { status: 400 }
      );
    }
    
    const { DB } = getCloudflareContext();
    
    // Verificar se o ticket existe e se o usuário tem permissão
    const ticketCheck = await DB.prepare(`
      SELECT created_by FROM tickets WHERE id = ?
    `).bind(ticketId).all();
    
    if (ticketCheck.results.length === 0) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }
    
    // Solicitantes só podem comentar em seus próprios tickets
    if (user.role === 'solicitante' && ticketCheck.results[0].created_by !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a comentar neste ticket' },
        { status: 403 }
      );
    }
    
    // Adicionar comentário
    const result = await DB.prepare(`
      INSERT INTO comments (ticket_id, user_id, content)
      VALUES (?, ?, ?)
      RETURNING id
    `).bind(ticketId, user.id, content).run();
    
    // Atualizar timestamp do ticket
    await DB.prepare(`
      UPDATE tickets
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(ticketId).run();
    
    // Criar notificações para os envolvidos no ticket
    if (user.role === 'solicitante') {
      // Notificar técnicos quando solicitante comenta
      await DB.prepare(`
        INSERT INTO notifications (user_id, ticket_id, type, message)
        SELECT u.id, ?, 'comentario', 'Novo comentário do solicitante no ticket #' || ?
        FROM users u
        WHERE u.role IN ('admin', 'tecnico')
        AND (u.id = (SELECT assigned_to FROM tickets WHERE id = ?) OR u.role = 'admin')
      `).bind(ticketId, ticketId, ticketId).run();
    } else {
      // Notificar solicitante quando técnico comenta
      await DB.prepare(`
        INSERT INTO notifications (user_id, ticket_id, type, message)
        SELECT created_by, ?, 'comentario', 'Novo comentário da equipe técnica no ticket #' || ?
        FROM tickets
        WHERE id = ?
      `).bind(ticketId, ticketId, ticketId).run();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Comentário adicionado com sucesso',
      comment_id: result.results[0].id
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// GET - Listar comentários de um ticket
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
    
    // Verificar se o ticket existe e se o usuário tem permissão
    const ticketCheck = await DB.prepare(`
      SELECT created_by FROM tickets WHERE id = ?
    `).bind(ticketId).all();
    
    if (ticketCheck.results.length === 0) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }
    
    // Solicitantes só podem ver comentários de seus próprios tickets
    if (user.role === 'solicitante' && ticketCheck.results[0].created_by !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a visualizar comentários deste ticket' },
        { status: 403 }
      );
    }
    
    // Buscar comentários
    const commentsQuery = `
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `;
    
    const commentsResult = await DB.prepare(commentsQuery).bind(ticketId).all();
    
    return NextResponse.json({
      comments: commentsResult.results
    });
  } catch (error) {
    console.error('Erro ao listar comentários:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
