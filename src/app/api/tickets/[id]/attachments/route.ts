import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getUser } from '@/lib/auth/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// POST - Adicionar anexo a um ticket
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
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
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
    
    // Solicitantes só podem anexar arquivos em seus próprios tickets
    if (user.role === 'solicitante' && ticketCheck.results[0].created_by !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a anexar arquivos neste ticket' },
        { status: 403 }
      );
    }
    
    // Gerar nome único para o arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Salvar arquivo
    await writeFile(join(uploadDir, filename), buffer);
    
    // Registrar anexo no banco de dados
    const result = await DB.prepare(`
      INSERT INTO attachments (
        ticket_id, 
        filename, 
        original_filename, 
        mime_type, 
        size, 
        uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id
    `).bind(
      ticketId,
      filename,
      file.name,
      file.type,
      file.size,
      user.id
    ).run();
    
    // Atualizar timestamp do ticket
    await DB.prepare(`
      UPDATE tickets
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(ticketId).run();
    
    // Criar notificações para os envolvidos no ticket
    if (user.role === 'solicitante') {
      // Notificar técnicos quando solicitante anexa arquivo
      await DB.prepare(`
        INSERT INTO notifications (user_id, ticket_id, type, message)
        SELECT u.id, ?, 'anexo', 'Novo anexo adicionado pelo solicitante no ticket #' || ?
        FROM users u
        WHERE u.role IN ('admin', 'tecnico')
        AND (u.id = (SELECT assigned_to FROM tickets WHERE id = ?) OR u.role = 'admin')
      `).bind(ticketId, ticketId, ticketId).run();
    } else {
      // Notificar solicitante quando técnico anexa arquivo
      await DB.prepare(`
        INSERT INTO notifications (user_id, ticket_id, type, message)
        SELECT created_by, ?, 'anexo', 'Novo anexo adicionado pela equipe técnica no ticket #' || ?
        FROM tickets
        WHERE id = ?
      `).bind(ticketId, ticketId, ticketId).run();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Arquivo anexado com sucesso',
      attachment: {
        id: result.results[0].id,
        filename: filename,
        original_filename: file.name,
        mime_type: file.type,
        size: file.size
      }
    });
  } catch (error) {
    console.error('Erro ao anexar arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// GET - Listar anexos de um ticket
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
    
    // Solicitantes só podem ver anexos de seus próprios tickets
    if (user.role === 'solicitante' && ticketCheck.results[0].created_by !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a visualizar anexos deste ticket' },
        { status: 403 }
      );
    }
    
    // Buscar anexos
    const attachmentsQuery = `
      SELECT a.*, u.name as uploaded_by_name
      FROM attachments a
      JOIN users u ON a.uploaded_by = u.id
      WHERE a.ticket_id = ?
      ORDER BY a.created_at ASC
    `;
    
    const attachmentsResult = await DB.prepare(attachmentsQuery).bind(ticketId).all();
    
    return NextResponse.json({
      attachments: attachmentsResult.results
    });
  } catch (error) {
    console.error('Erro ao listar anexos:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
