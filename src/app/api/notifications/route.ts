import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getUser } from '@/lib/auth/auth';

// GET - Obter notificações do usuário
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
    
    // Buscar notificações do usuário
    const notificationsQuery = `
      SELECT n.*, t.requester_name, t.status
      FROM notifications n
      JOIN tickets t ON n.ticket_id = t.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `;
    
    const { results } = await DB.prepare(notificationsQuery).bind(user.id).all();
    
    return NextResponse.json({
      notifications: results
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// PATCH - Marcar notificação como lida
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { notification_id } = body;
    
    if (!notification_id) {
      return NextResponse.json(
        { error: 'ID da notificação é obrigatório' },
        { status: 400 }
      );
    }
    
    const { DB } = getCloudflareContext();
    
    // Verificar se a notificação pertence ao usuário
    const checkQuery = `
      SELECT id FROM notifications
      WHERE id = ? AND user_id = ?
    `;
    
    const checkResult = await DB.prepare(checkQuery).bind(notification_id, user.id).all();
    
    if (checkResult.results.length === 0) {
      return NextResponse.json(
        { error: 'Notificação não encontrada ou não pertence ao usuário' },
        { status: 404 }
      );
    }
    
    // Marcar como lida
    await DB.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ?
    `).bind(notification_id).run();
    
    return NextResponse.json({
      success: true,
      message: 'Notificação marcada como lida'
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
