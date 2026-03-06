import { NextRequest, NextResponse } from 'next/server';
import { UsuarioService } from '@/services/UsuarioService';

// Forzar que esta ruta siempre sea dinámica (sin caché en Vercel)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const service = new UsuarioService();

export async function GET() {
  try {
    const usuarios = await service.getAllUsuarios();
    return NextResponse.json(usuarios);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = await service.saveUsuario(body);
    return NextResponse.json({ id, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await service.deleteUsuario(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, sucursal, caja, cobrador } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await service.saveUsuario({ sucursal, caja, cobrador }, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
