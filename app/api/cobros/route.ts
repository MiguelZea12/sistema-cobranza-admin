import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { Cobro } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clienteId,
      clienteCedula,
      clienteNombre,
      monto,
      saldoAnterior,
      saldoNuevo,
      formaPago,
      observaciones,
      imageUrl,
      contratoId,
      contratoReferencia,
      contratoLinea,
      contratoSucursal,
      letrasPagadas,
      totalLetras,
      numeroComprobante,
      datosCheque,
      tipoTarjeta,
      sucursal,
      caja,
      cobrador,
      createdBy,
      contratosActualizados,
      nuevoSaldoPendiente,
      nuevoSaldoVencido,
      nuevoSaldoPorVencer,
    } = body;

    if (!clienteId || !monto || !formaPago) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const db = adminDb();

    // Generar número de comprobante si no viene del cliente
    let numeroComprobanteGenerado = numeroComprobante;
    if (!numeroComprobanteGenerado && createdBy) {
      try {
        // Buscar el documento del usuario por campo 'usuario'
        const usuarioSnap = await db.collection('usuarios')
          .where('usuario', '==', createdBy)
          .limit(1)
          .get();

        if (!usuarioSnap.empty) {
          const usuarioRef = usuarioSnap.docs[0].ref;
          numeroComprobanteGenerado = await db.runTransaction(async (transaction) => {
            const usuarioDoc = await transaction.get(usuarioRef);
            const userData = usuarioDoc.data()!;
            const codigoUsuario = (userData.codigoUsuario || '001').toString().padStart(3, '0');
            const nuevaSecuencia = (userData.secuenciaComprobante || 0) + 1;
            transaction.update(usuarioRef, {
              secuenciaComprobante: nuevaSecuencia,
              updatedAt: FieldValue.serverTimestamp(),
            });
            return `${codigoUsuario}${nuevaSecuencia.toString().padStart(6, '0')}`;
          });
        }
      } catch (e) {
        // No crítico, continuar sin comprobante
        console.warn('No se pudo generar número de comprobante:', e);
      }
    }

    // Construir objeto cobro
    const cobroData: any = {
      clienteId,
      clienteCedula,
      clienteNombre,
      monto,
      saldoAnterior,
      saldoNuevo,
      formaPago,
      fecha: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      syncStatus: 'pending',
      offlineSync: false,
    };

    if (contratoId) cobroData.contratoId = contratoId;
    if (contratoReferencia) cobroData.contratoReferencia = contratoReferencia;
    if (contratoLinea) cobroData.contratoLinea = contratoLinea;
    if (contratoSucursal !== undefined && contratoSucursal !== null) cobroData.contratoSucursal = contratoSucursal;
    if (observaciones) cobroData.observaciones = observaciones;
    if (imageUrl) cobroData.imageUrl = imageUrl;
    if (letrasPagadas && letrasPagadas.length > 0) cobroData.letrasPagadas = letrasPagadas;
    if (totalLetras !== undefined) cobroData.totalLetras = totalLetras;
    if (numeroComprobanteGenerado) cobroData.numeroComprobante = numeroComprobanteGenerado;
    if (datosCheque) cobroData.datosCheque = datosCheque;
    if (tipoTarjeta) cobroData.tipoTarjeta = tipoTarjeta;
    if (sucursal) cobroData.sucursal = sucursal;
    if (caja) cobroData.caja = caja;
    if (cobrador) cobroData.cobrador = cobrador;
    if (createdBy) cobroData.createdBy = createdBy;

    // Guardar cobro Y actualizar cliente en un batch atómico para evitar
    // que un fallo parcial deje el saldo inconsistente y genere doble cobro.
    const cobroRef = db.collection('cobros').doc();
    const clienteRef = db.collection('clientes').doc(clienteId);

    const clienteUpdateData: any = {
      saldoPendiente: nuevoSaldoPendiente,
      saldoVencido: nuevoSaldoVencido,
      saldoPorVencer: nuevoSaldoPorVencer,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (contratosActualizados) {
      clienteUpdateData.contratos = contratosActualizados;
    }

    const batch = db.batch();
    batch.set(cobroRef, cobroData);
    batch.update(clienteRef, clienteUpdateData);
    await batch.commit();

    return NextResponse.json({ id: cobroRef.id, success: true });
  } catch (error: any) {
    console.error('Error registrando cobro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const usuario = searchParams.get('usuario');
    const cliente = searchParams.get('cliente');
    const formaPago = searchParams.get('formaPago');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    let query = adminDb().collection('cobros').orderBy('fecha', 'desc');

    // Filtrar por usuario si se proporciona
    if (usuario) {
      query = query.where('createdBy', '==', usuario) as any;
    }

    const snapshot = await query.get();
    let cobros = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate?.() || data.fecha,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Cobro;
    });

    // Filtrar por cliente en memoria
    if (cliente) {
      cobros = cobros.filter(c => 
        c.clienteNombre.toLowerCase().includes(cliente.toLowerCase()) ||
        c.clienteCedula.includes(cliente)
      );
    }

    // Filtrar por forma de pago
    if (formaPago) {
      cobros = cobros.filter(c => c.formaPago === formaPago);
    }

    // Filtrar por rango de fechas en memoria
    if (fechaInicio || fechaFin) {
      cobros = cobros.filter(cobro => {
        const fechaCobro = new Date(cobro.fecha);
        if (fechaInicio && fechaCobro < new Date(fechaInicio)) return false;
        if (fechaFin && fechaCobro > new Date(fechaFin)) return false;
        return true;
      });
    }

    return NextResponse.json(cobros);
  } catch (error: any) {
    console.error('Error obteniendo cobros:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, createdBy, cobrador, caja, sucursal, formaPago, datosCheque, tipoTarjeta, anulado } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID del cobro requerido' }, { status: 400 });
    }

    const db = adminDb();
    const updateData: any = { updatedAt: FieldValue.serverTimestamp() };
    if (createdBy !== undefined) updateData.createdBy = createdBy;
    if (cobrador !== undefined) updateData.cobrador = cobrador;
    if (caja !== undefined) updateData.caja = caja;
    if (sucursal !== undefined) updateData.sucursal = sucursal;
    if (anulado !== undefined) {
      updateData.anulado = anulado;
      if (anulado) {
        updateData.syncStatus = 'anulado';

        // Revertir saldos del cliente y letras del contrato
        const cobroSnap = await db.collection('cobros').doc(id).get();
        if (cobroSnap.exists) {
          const cobroData = cobroSnap.data()!;
          const {
            clienteId,
            monto: montoRevertir,
            contratoId,
            letrasPagadas: letrasPagadasCobro,
          } = cobroData;

          if (clienteId) {
            const clienteSnap = await db.collection('clientes').doc(clienteId).get();
            if (clienteSnap.exists) {
              const clienteData = clienteSnap.data()!;
              const clienteUpdate: any = {
                // Devolver el monto cobrado al saldo pendiente del cliente
                saldoPendiente: (clienteData.saldoPendiente || 0) + (montoRevertir || 0),
                updatedAt: FieldValue.serverTimestamp(),
              };

              // Revertir letras del contrato si hay datos suficientes
              if (
                contratoId &&
                Array.isArray(letrasPagadasCobro) &&
                letrasPagadasCobro.length > 0 &&
                Array.isArray(clienteData.contratos)
              ) {
                const contratos = clienteData.contratos.map((c: any) => ({ ...c }));
                const contratoIdx = contratos.findIndex(
                  (c: any) => c.transaccion === contratoId,
                );

                if (contratoIdx !== -1) {
                  const contrato = { ...contratos[contratoIdx] };
                  const letras: any[] = Array.isArray(contrato.letras)
                    ? contrato.letras.map((l: any) => ({ ...l }))
                    : [];

                  let montoTotalRevertido = 0;
                  const hoy = new Date();

                  // Revertir cada letra pagada en este cobro
                  for (const letraPagada of letrasPagadasCobro as Array<{ numero: number; monto: number }>) {
                    const letraIdx = letras.findIndex((l: any) => l.numero === letraPagada.numero);
                    if (letraIdx !== -1) {
                      const letra = letras[letraIdx];
                      const nuevoPago = Math.max(0, (letra.pago || 0) - letraPagada.monto);
                      const nuevoPendiente = Math.max(0, (letra.valor || 0) - nuevoPago);

                      // Recalcular estado de la letra
                      let nuevoEstado: string;
                      if (nuevoPendiente <= 0) {
                        nuevoEstado = 'pagado';
                      } else if (nuevoPago > 0) {
                        nuevoEstado = 'parcial';
                      } else {
                        // Determinar si está vencida
                        const fv = letra.fechaVencimiento;
                        let fechaVenc: Date | null = null;
                        if (fv) {
                          if (typeof fv.toDate === 'function') {
                            fechaVenc = fv.toDate();
                          } else if (fv._seconds) {
                            fechaVenc = new Date(fv._seconds * 1000);
                          } else {
                            fechaVenc = new Date(fv);
                          }
                        }
                        nuevoEstado =
                          fechaVenc && fechaVenc < hoy && letra.numero > 0
                            ? 'vencido'
                            : 'pendiente';
                      }

                      letras[letraIdx] = {
                        ...letra,
                        pago: nuevoPago,
                        pendiente: nuevoPendiente,
                        estado: nuevoEstado,
                      };
                      montoTotalRevertido += letraPagada.monto;
                    }
                  }

                  // Recalcular totales del contrato a partir de las letras revertidas
                  let saldoVencidoContrato = 0;
                  let saldoPorVencerContrato = 0;
                  let letrasPagadasCount = 0;

                  for (const letra of letras) {
                    if (letra.estado === 'pagado') {
                      letrasPagadasCount++;
                    } else if ((letra.pendiente || 0) > 0) {
                      const fv = letra.fechaVencimiento;
                      let fechaVenc: Date | null = null;
                      if (fv) {
                        if (typeof fv.toDate === 'function') {
                          fechaVenc = fv.toDate();
                        } else if (fv._seconds) {
                          fechaVenc = new Date(fv._seconds * 1000);
                        } else {
                          fechaVenc = new Date(fv);
                        }
                      }
                      if (fechaVenc && fechaVenc < hoy && letra.numero > 0) {
                        saldoVencidoContrato += letra.pendiente;
                      } else {
                        saldoPorVencerContrato += letra.pendiente;
                      }
                    }
                  }

                  contratos[contratoIdx] = {
                    ...contrato,
                    letras,
                    pago: Math.max(0, (contrato.pago || 0) - montoTotalRevertido),
                    saldoVencido: saldoVencidoContrato,
                    saldoPorVencer: saldoPorVencerContrato,
                    letrasPagadas: letrasPagadasCount,
                  };

                  // Recalcular saldoVencido y saldoPorVencer totales del cliente
                  let totalSaldoVencido = 0;
                  let totalSaldoPorVencer = 0;
                  for (const c of contratos) {
                    totalSaldoVencido += c.saldoVencido || 0;
                    totalSaldoPorVencer += c.saldoPorVencer || 0;
                  }

                  clienteUpdate.contratos = contratos;
                  clienteUpdate.saldoVencido = totalSaldoVencido;
                  clienteUpdate.saldoPorVencer = totalSaldoPorVencer;
                }
              }

              await db.collection('clientes').doc(clienteId).update(clienteUpdate);
            }
          }
        }
      }
    }

    if (formaPago !== undefined) {
      updateData.formaPago = formaPago;
      
      // Actualizar campos dependientes de la forma de pago
      if (formaPago === 'cheque') {
        if (datosCheque) updateData.datosCheque = datosCheque;
        updateData.tipoTarjeta = FieldValue.delete(); // Limpiar si existía
      } else if (formaPago === 'tarjeta') {
        if (tipoTarjeta) updateData.tipoTarjeta = tipoTarjeta;
        updateData.datosCheque = FieldValue.delete(); // Limpiar si existía
      } else {
        // Efectivo o transferencia
        updateData.datosCheque = FieldValue.delete();
        updateData.tipoTarjeta = FieldValue.delete();
      }
    }

    await db.collection('cobros').doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error actualizando cobro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
