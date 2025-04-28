import nodemailer from 'nodemailer';
import { getCloudflareContext } from './cloudflare';

// Configuração do transportador de email
// Em ambiente de produção, substituir por configurações reais
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'ethereal.user@ethereal.email',
    pass: 'ethereal_pass'
  }
});

// Tipos de notificação
export type NotificationType = 'novo_ticket' | 'comentario' | 'mudanca_status' | 'atribuicao' | 'anexo';

// Interface para dados de notificação
export interface NotificationData {
  ticketId: number;
  userId: number;
  type: NotificationType;
  message: string;
  details?: Record<string, any>;
}

// Função para enviar email de notificação
export async function sendEmailNotification(to: string, subject: string, html: string): Promise<boolean> {
  try {
    // Em ambiente de desenvolvimento, apenas simular o envio
    if (process.env.NODE_ENV === 'development') {
      console.log('Simulando envio de email:');
      console.log(`Para: ${to}`);
      console.log(`Assunto: ${subject}`);
      console.log(`Conteúdo: ${html}`);
      return true;
    }

    // Em produção, enviar o email
    const info = await transporter.sendMail({
      from: '"Sistema de Tickets" <tickets@exemplo.com>',
      to,
      subject,
      html
    });

    console.log('Email enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

// Função para criar notificação no sistema e enviar email
export async function createNotification(data: NotificationData): Promise<boolean> {
  try {
    const { DB } = getCloudflareContext();

    // Inserir notificação no banco de dados
    await DB.prepare(`
      INSERT INTO notifications (user_id, ticket_id, type, message)
      VALUES (?, ?, ?, ?)
    `).bind(data.userId, data.ticketId, data.type, data.message).run();

    // Buscar email do usuário
    const { results } = await DB.prepare(`
      SELECT email FROM users WHERE id = ?
    `).bind(data.userId).all();

    if (results.length === 0) {
      console.error('Usuário não encontrado para notificação');
      return false;
    }

    const userEmail = results[0].email;

    // Buscar informações do ticket para o email
    const ticketResult = await DB.prepare(`
      SELECT t.id, t.requester_name, t.status, u.name as unit_name, s.name as sector_name
      FROM tickets t
      JOIN units u ON t.unit_id = u.id
      JOIN sectors s ON t.sector_id = s.id
      WHERE t.id = ?
    `).bind(data.ticketId).all();

    if (ticketResult.results.length === 0) {
      console.error('Ticket não encontrado para notificação');
      return false;
    }

    const ticket = ticketResult.results[0];

    // Preparar assunto e conteúdo do email com base no tipo de notificação
    let subject = '';
    let html = '';

    switch (data.type) {
      case 'novo_ticket':
        subject = `Novo ticket #${ticket.id} aberto`;
        html = `
          <h2>Novo ticket aberto</h2>
          <p>Um novo ticket foi aberto no sistema:</p>
          <ul>
            <li><strong>Ticket:</strong> #${ticket.id}</li>
            <li><strong>Solicitante:</strong> ${ticket.requester_name}</li>
            <li><strong>Unidade:</strong> ${ticket.unit_name}</li>
            <li><strong>Setor:</strong> ${ticket.sector_name}</li>
          </ul>
          <p>Acesse o sistema para mais detalhes.</p>
        `;
        break;

      case 'comentario':
        subject = `Novo comentário no ticket #${ticket.id}`;
        html = `
          <h2>Novo comentário</h2>
          <p>Um novo comentário foi adicionado ao ticket #${ticket.id}:</p>
          <p>${data.message}</p>
          <p>Acesse o sistema para mais detalhes.</p>
        `;
        break;

      case 'mudanca_status':
        subject = `Status do ticket #${ticket.id} atualizado`;
        html = `
          <h2>Status atualizado</h2>
          <p>O status do ticket #${ticket.id} foi atualizado:</p>
          <p>${data.message}</p>
          <p>Acesse o sistema para mais detalhes.</p>
        `;
        break;

      case 'atribuicao':
        subject = `Ticket #${ticket.id} atribuído`;
        html = `
          <h2>Ticket atribuído</h2>
          <p>O ticket #${ticket.id} foi atribuído:</p>
          <p>${data.message}</p>
          <p>Acesse o sistema para mais detalhes.</p>
        `;
        break;

      case 'anexo':
        subject = `Novo anexo no ticket #${ticket.id}`;
        html = `
          <h2>Novo anexo</h2>
          <p>Um novo arquivo foi anexado ao ticket #${ticket.id}:</p>
          <p>${data.message}</p>
          <p>Acesse o sistema para mais detalhes.</p>
        `;
        break;

      default:
        subject = `Notificação do sistema de tickets - #${ticket.id}`;
        html = `
          <h2>Notificação</h2>
          <p>${data.message}</p>
          <p>Acesse o sistema para mais detalhes.</p>
        `;
    }

    // Enviar email
    return await sendEmailNotification(userEmail, subject, html);
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return false;
  }
}

// Função para processar notificações pendentes
export async function processNotifications(): Promise<void> {
  try {
    const { DB } = getCloudflareContext();

    // Buscar notificações não lidas
    const { results } = await DB.prepare(`
      SELECT n.*, u.email, t.requester_name, t.status
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      JOIN tickets t ON n.ticket_id = t.id
      WHERE n.is_read = 0
      LIMIT 50
    `).all();

    for (const notification of results) {
      // Preparar assunto e conteúdo do email
      const subject = `Notificação do sistema de tickets - #${notification.ticket_id}`;
      const html = `
        <h2>Notificação</h2>
        <p>${notification.message}</p>
        <p>Acesse o sistema para mais detalhes.</p>
      `;

      // Enviar email
      await sendEmailNotification(notification.email, subject, html);

      // Marcar como lida
      await DB.prepare(`
        UPDATE notifications
        SET is_read = 1
        WHERE id = ?
      `).bind(notification.id).run();
    }
  } catch (error) {
    console.error('Erro ao processar notificações:', error);
  }
}
