import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth/auth';

export async function POST(request: NextRequest) {
  try {
    await logout();
    
    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro na rota de logout:', error);
    return NextResponse.json(
      { error: 'Erro ao processar logout' },
      { status: 500 }
    );
  }
}
