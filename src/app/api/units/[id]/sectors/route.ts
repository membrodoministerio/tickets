import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getUser } from '@/lib/auth/auth';

// GET - Listar setores de uma unidade específica
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
    
    const unitId = parseInt(params.id);
    
    if (isNaN(unitId)) {
      return NextResponse.json(
        { error: 'ID de unidade inválido' },
        { status: 400 }
      );
    }
    
    const { DB } = getCloudflareContext();
    
    // Verificar se a unidade existe
    const unitCheck = await DB.prepare(`
      SELECT id FROM units WHERE id = ?
    `).bind(unitId).all();
    
    if (unitCheck.results.length === 0) {
      return NextResponse.json(
        { error: 'Unidade não encontrada' },
        { status: 404 }
      );
    }
    
    // Buscar setores da unidade
    const { results } = await DB.prepare(`
      SELECT * FROM sectors
      WHERE unit_id = ?
      ORDER BY name ASC
    `).bind(unitId).all();
    
    return NextResponse.json({ sectors: results });
  } catch (error) {
    console.error('Erro ao listar setores:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
