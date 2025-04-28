import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export function middleware(request: NextRequest) {
  const sessionId = cookies().get('session_id')?.value;
  
  // Verificar se o usuário está autenticado
  if (!sessionId) {
    // Redirecionar para a página de login se não estiver autenticado
    // e a rota atual não for a página de login ou uma rota pública
    const url = request.nextUrl.clone();
    
    if (!url.pathname.startsWith('/login') && 
        !url.pathname.startsWith('/api/auth') && 
        !url.pathname.startsWith('/_next') && 
        !url.pathname.startsWith('/public')) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplicar middleware a todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
