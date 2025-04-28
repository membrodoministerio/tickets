import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getUser } from '@/lib/auth/auth';

// GET - Listar todas as unidades
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
    
    // Buscar todas as unidades
    const { results } = await DB.prepare(`
      SELECT * FROM units
      ORDER BY name ASC
    `).all();
    
    return NextResponse.json({ units: results });
  } catch (error) {
    console.error('Erro ao listar unidades:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
