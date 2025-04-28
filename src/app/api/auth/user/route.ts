import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      authenticated: true,
      user
    });
  } catch (error) {
    console.error('Erro na rota de verificação de usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar autenticação' },
      { status: 500 }
    );
  }
}
