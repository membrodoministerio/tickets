import { NextRequest, NextResponse } from 'next/server';
import { login, LoginCredentials } from '@/lib/auth/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const credentials: LoginCredentials = {
      email: body.email,
      password: body.password
    };

    const result = await login(credentials);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user
    });
  } catch (error) {
    console.error('Erro na rota de login:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
