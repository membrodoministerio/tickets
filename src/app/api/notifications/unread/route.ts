import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getUser } from '@/lib/auth/auth';

// GET - Listar notificações não lidas
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
    
    // Buscar notificações não lidas do usuário
    const { results } = await DB.prepare(`
      SELECT n.*, t.id as ticket_id, t.requester_name
      FROM notifications n
      JOIN tickets t ON n.ticket_id = t.id
      WHERE n.user_id = ? AND n.is_read = 0
      ORDER BY n.created_at DESC
      LIMIT 10
    `).bind(user.id).all();
    
    return NextResponse.json({ notifications: results });
  } catch (error) {
    console.error('Erro ao buscar notificações não lidas:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
