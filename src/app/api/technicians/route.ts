import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getUser } from '@/lib/auth/auth';

// GET - Listar todos os técnicos
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Apenas administradores e técnicos podem listar técnicos
    if (user.role === 'solicitante') {
      return NextResponse.json(
        { error: 'Não autorizado a listar técnicos' },
        { status: 403 }
      );
    }
    
    const { DB } = getCloudflareContext();
    
    // Buscar todos os técnicos
    const { results } = await DB.prepare(`
      SELECT id, name, email
      FROM users
      WHERE role = 'tecnico' OR role = 'admin'
      ORDER BY name ASC
    `).all();
    
    return NextResponse.json({ technicians: results });
  } catch (error) {
    console.error('Erro ao listar técnicos:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
