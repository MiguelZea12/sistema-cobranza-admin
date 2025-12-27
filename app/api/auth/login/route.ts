import { NextRequest, NextResponse } from 'next/server';
import { UsuarioService } from '@/services/UsuarioService';

const service = new UsuarioService();

export async function POST(request: NextRequest) {
  try {
    const { usuario, clave } = await request.json();

    if (!usuario || !clave) {
      return NextResponse.json(
        { error: 'Usuario y contraseña requeridos' },
        { status: 400 }
      );
    }

    // Obtener todos los usuarios
    const usuarios = await service.getAllUsuarios();
    
    // Buscar el usuario
    const user = usuarios.find(u => u.usuario === usuario && u.clave === clave);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Retornar datos del usuario (sin la contraseña)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        usuario: user.usuario,
        codigo: user.codigo
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
