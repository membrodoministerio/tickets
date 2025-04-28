import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { getCloudflareContext } from '../cloudflare';

// Tipos para autenticação
export type User = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'tecnico' | 'solicitante';
};

export type LoginCredentials = {
  email: string;
  password: string;
};

// Função para verificar se o usuário está autenticado
export async function getUser(): Promise<User | null> {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (!sessionId) {
    return null;
  }
  
  try {
    const { DB } = getCloudflareContext();
    
    // Buscar usuário pelo ID da sessão
    const { results } = await DB.prepare(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      JOIN sessions s ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `).bind(sessionId).all();
    
    if (results.length === 0) {
      return null;
    }
    
    return results[0] as User;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

// Função para login
export async function login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const { DB } = getCloudflareContext();
    
    // Buscar usuário pelo email
    const { results } = await DB.prepare(`
      SELECT id, name, email, password, role
      FROM users
      WHERE email = ?
    `).bind(credentials.email).all();
    
    if (results.length === 0) {
      return { success: false, message: 'Email ou senha incorretos' };
    }
    
    const user = results[0] as User & { password: string };
    
    // Verificar senha
    const passwordMatch = await bcrypt.compare(credentials.password, user.password);
    
    if (!passwordMatch) {
      return { success: false, message: 'Email ou senha incorretos' };
    }
    
    // Criar sessão
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Sessão válida por 7 dias
    
    await DB.prepare(`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (?, ?, ?)
    `).bind(sessionId, user.id, expiresAt.toISOString()).run();
    
    // Definir cookie de sessão
    cookies().set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    });
    
    const { password, ...userWithoutPassword } = user;
    
    return { 
      success: true, 
      message: 'Login realizado com sucesso',
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return { success: false, message: 'Erro ao processar login' };
  }
}

// Função para logout
export async function logout() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (sessionId) {
    try {
      const { DB } = getCloudflareContext();
      
      // Remover sessão do banco de dados
      await DB.prepare(`
        DELETE FROM sessions
        WHERE id = ?
      `).bind(sessionId).run();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
  
  // Remover cookie de sessão
  cookies().delete('session_id');
}

// Middleware para verificar autenticação
export async function requireAuth(allowedRoles?: string[]) {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect('/unauthorized');
  }
  
  return user;
}

// Função para criar hash de senha
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
