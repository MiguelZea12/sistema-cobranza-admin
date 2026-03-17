'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search, ChevronDown, ChevronUp, MapPin, Phone, Briefcase, Calendar,
  DollarSign, CreditCard, X, Check, User, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, AlertTriangle, FileText, Upload, Image as ImageIcon,
  Banknote, Smartphone, FileCheck, Package
} from 'lucide-react';
import { Cliente, ContratoCliente, LetraContrato } from '@/lib/types';

// ─── Constantes ───────────────────────────────────────────────────────────────
const BANCOS_ECUADOR = [
  'Banco Pichincha', 'Banco de Guayaquil', 'Banco del Pacífico',
  'Banco Bolivariano', 'Banco del Austro', 'Banco Internacional',
  'Produbanco', 'Banco de Machala', 'Banco de Loja', 'Banco Amazonas',
  'Banco Comercial de Manabí', 'Banco del Litoral', 'Banco Económico',
  'Banco Capital', 'Banco Solidario', 'Banco ProCredit', 'BanEcuador', 'Otros',
];

const TIPOS_TARJETA = [
  'Visa', 'Mastercard', 'Diners', 'American Express',
  'Pacificard', 'Bankard', 'Cuota Fácil', 'Banco del Austro',
  'Visa Electron', 'Discovery', 'Alia',
];

const CLOUDINARY_CLOUD_NAME = 'dck3chn5v';
const CLOUDINARY_UPLOAD_PRESET = 'cobranza_app';
const ITEMS_PER_PAGE = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getColorMora(estadoMora?: string) {
  if (!estadoMora || estadoMora === 'NORMAL')
    return { badge: 'bg-green-100 text-green-700 border-green-200', text: 'text-green-600' };
  if (estadoMora === 'MORA 1')
    return { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', text: 'text-yellow-600' };
  if (estadoMora === 'MORA 2')
    return { badge: 'bg-orange-100 text-orange-700 border-orange-200', text: 'text-orange-600' };
  return { badge: 'bg-red-100 text-red-700 border-red-200', text: 'text-red-600' };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function agruparClientesPorCedula(clientesRaw: Cliente[]): Cliente[] {
  const map = new Map<string, Cliente>();
  clientesRaw.forEach((cliente) => {
    if (map.has(cliente.cedula)) {
      const existente = map.get(cliente.cedula)!;
      if (cliente.contratos && cliente.contratos.length > 0) {
        if (!existente.contratos) existente.contratos = [];
        const idsExistentes = new Set(existente.contratos.map((c) => c.transaccion));
        cliente.contratos.forEach((nuevo) => {
          if (!idsExistentes.has(nuevo.transaccion)) existente.contratos!.push(nuevo);
        });
      }
      let sp = 0, sv = 0, spv = 0;
      existente.contratos?.forEach((c) => {
        sp += (c.totalContrato || 0) - (c.pago || 0) - (c.nc || 0);
        sv += c.saldoVencido || 0;
        spv += c.saldoPorVencer || 0;
      });
      existente.saldoPendiente = sp;
      existente.saldoVencido = sv;
      existente.saldoPorVencer = spv;
    } else {
      map.set(cliente.cedula, { ...cliente });
    }
  });
  return Array.from(map.values());
}

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'cobros');
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!res.ok) throw new Error('No se pudo subir la imagen');
  const data = await res.json();
  return data.secure_url as string;
}

// ─── Componente ClienteCard ───────────────────────────────────────────────────
function ClienteCard({
  cliente,
  isExpanded,
  onToggleExpand,
  onCobrar,
}: {
  cliente: Cliente;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onCobrar: (cliente: Cliente) => void;
}) {
  const mora = getColorMora(cliente.estadoMora);
  const totalContratos = cliente.contratos?.length || 0;
  const contrato = cliente.contratos?.[0];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header clickeable */}
      <button
        className="w-full text-left px-4 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors"
        onClick={() => onToggleExpand(cliente.id!)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{cliente.nombre}</p>
          <p className="text-sm text-gray-500 mt-0.5">CI: {cliente.cedula}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {totalContratos > 1 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700 border border-sky-200">
                {totalContratos} contratos
              </span>
            )}
            {cliente.estadoMora && cliente.estadoMora !== 'NORMAL' && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${mora.badge}`}>
                {cliente.estadoMora}
              </span>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
        )}
      </button>

      {/* Cuerpo expandible */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
            <span>{cliente.direccion || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 shrink-0 text-gray-400" />
            <span>{cliente.telefono || '—'}</span>
          </div>
          {totalContratos > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Briefcase className="h-4 w-4 shrink-0 text-gray-400" />
              <span>{totalContratos} {totalContratos === 1 ? 'contrato activo' : 'contratos activos'}</span>
            </div>
          )}
          {contrato && (
            <>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                <span>
                  Contrato #{contrato.referencia || contrato.transaccion} · Letras{' '}
                  {contrato.letrasPagadas}/{contrato.totalLetras}
                </span>
              </div>
              {contrato.linea && (
                <div className="flex items-start gap-2 text-sm">
                  <Package className="h-4 w-4 shrink-0 mt-0.5 text-sky-500" />
                  <span className="text-gray-600 font-medium">Producto: </span>
                  <span className="text-sky-700 font-medium">{contrato.linea}</span>
                </div>
              )}
            </>
          )}
          {contrato?.fechaUltimoPago && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
              <span>
                Último pago:{' '}
                {new Date(contrato.fechaUltimoPago as any).toLocaleDateString('es-EC')}
                {contrato.montoUltimoPago ? ` · ${formatCurrency(contrato.montoUltimoPago)}` : ''}
              </span>
            </div>
          )}
          {(cliente.diasMora ?? 0) > 0 && (
            <div className={`flex items-center gap-2 text-sm font-semibold ${mora.text}`}>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{cliente.diasMora} días de mora</span>
            </div>
          )}

          {cliente.saldoPendiente > 0 && (
            <button
              onClick={() => onCobrar(cliente)}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              <Banknote className="h-5 w-5" />
              Cobrar
            </button>
          )}
        </div>
      )}

      {/* Footer — saldos */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-3 flex-wrap">
        {cliente.saldoVencido > 0 && (
          <div>
            <p className="text-xs text-gray-500">Vencido</p>
            <p className="text-sm font-bold text-red-600">{formatCurrency(cliente.saldoVencido)}</p>
          </div>
        )}
        {cliente.saldoPorVencer > 0 && (
          <div>
            <p className="text-xs text-gray-500">Por vencer</p>
            <p className="text-sm font-bold text-yellow-600">{formatCurrency(cliente.saldoPorVencer)}</p>
          </div>
        )}
        {cliente.saldoPendiente <= 0 && (
          <p className="text-xs text-green-600 font-medium">Sin deuda pendiente</p>
        )}
      </div>
    </div>
  );
}

// ─── Componente CobroModal ────────────────────────────────────────────────────
function CobroModal({
  cliente,
  onClose,
  onSuccess,
}: {
  cliente: Cliente;
  onClose: () => void;
  onSuccess: (clienteActualizado: Cliente) => void;
}) {
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoCliente | null>(
    cliente.contratos?.[0] ?? null
  );
  const [letrasSeleccionadas, setLetrasSeleccionadas] = useState<Map<number, string>>(new Map());
  const [formaPago, setFormaPago] = useState<'efectivo' | 'transferencia' | 'cheque' | 'tarjeta'>('efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [chequeBanco, setChequeBanco] = useState('');
  const [chequeBancoOtro, setChequeBancoOtro] = useState('');
  const [chequeNumero, setChequeNumero] = useState('');
  const [tipoTarjeta, setTipoTarjeta] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const seleccionarContrato = useCallback((c: ContratoCliente) => {
    setContratoSeleccionado(c);
    setLetrasSeleccionadas(new Map());
  }, []);

  const toggleLetra = useCallback((letra: LetraContrato) => {
    setLetrasSeleccionadas((prev) => {
      const m = new Map(prev);
      if (m.has(letra.numero)) m.delete(letra.numero);
      else m.set(letra.numero, letra.pendiente.toFixed(2));
      return m;
    });
  }, []);

  const actualizarMontoLetra = useCallback((numero: number, monto: string) => {
    setLetrasSeleccionadas((prev) => {
      const m = new Map(prev);
      m.set(numero, monto);
      return m;
    });
  }, []);

  const calcularSaldoTotal = () => {
    if (contratoSeleccionado) {
      return (contratoSeleccionado.totalContrato || 0)
        - (contratoSeleccionado.pago || 0)
        - (contratoSeleccionado.nc || 0);
    }
    return cliente.saldoPendiente;
  };

  const calcularMontoSeleccionado = () =>
    Array.from(letrasSeleccionadas.values()).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  const calcularSaldoRestante = () => calcularSaldoTotal() - calcularMontoSeleccionado();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const procesarPago = async () => {
    setError(null);
    const letrasPagadasArray = Array.from(letrasSeleccionadas.entries()).map(([numero, monto]) => ({
      numero,
      monto: parseFloat(monto),
    }));
    const montoTotal = letrasPagadasArray.reduce((s, l) => s + l.monto, 0);

    if (montoTotal <= 0) {
      setError('Debe seleccionar al menos una letra y especificar un monto');
      return;
    }
    if (formaPago === 'cheque') {
      if (!chequeBanco) { setError('Debe seleccionar el banco del cheque'); return; }
      if (chequeBanco === 'Otros' && !chequeBancoOtro.trim()) { setError('Debe ingresar el nombre del banco'); return; }
      if (!chequeNumero.trim()) { setError('Debe ingresar el número de cheque'); return; }
    }
    if (formaPago === 'tarjeta' && !tipoTarjeta) {
      setError('Debe seleccionar el tipo de tarjeta');
      return;
    }
    if (contratoSeleccionado?.letras) {
      for (const lp of letrasPagadasArray) {
        const letra = contratoSeleccionado.letras.find((l) => l.numero === lp.numero);
        if (letra && lp.monto > letra.pendiente + 0.01) {
          setError(`El monto de la letra ${letra.numero === 0 ? 'ENTRADA' : `#${letra.numero}`} excede su pendiente (${formatCurrency(letra.pendiente)})`);
          return;
        }
      }
    }

    setProcesando(true);
    try {
      // Subir imagen si existe
      let imageUrl: string | undefined;
      if (imageFile) {
        setUploadingImage(true);
        try { imageUrl = await uploadToCloudinary(imageFile); }
        catch { /* continuar sin imagen */ }
        finally { setUploadingImage(false); }
      }

      // Obtener datos del usuario desde localStorage
      let createdBy: string | undefined;
      let sucursal: string | undefined;
      let caja: string | undefined;
      let cobrador: string | undefined;
      try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          createdBy = user.usuario || user.email || undefined;
          sucursal = user.sucursal || undefined;
          caja = user.caja || undefined;
          cobrador = user.cobrador || undefined;
        }
      } catch { /* ignorar */ }

      // Calcular contratos actualizados
      const hoy = new Date();
      let contratosActualizados = cliente.contratos ? [...cliente.contratos] : [];

      if (contratoSeleccionado && letrasPagadasArray.length > 0) {
        contratosActualizados = contratosActualizados.map((contrato) => {
          if (contrato.transaccion !== contratoSeleccionado.transaccion) return contrato;
          const letrasActualizadas = (contrato.letras || []).map((letra) => {
            const lp = letrasPagadasArray.find((x) => x.numero === letra.numero);
            if (!lp) return letra;
            const nuevoPago = Math.round((letra.pago + lp.monto) * 100) / 100;
            const nuevoPendiente = Math.max(0, Math.round((letra.valor - nuevoPago) * 100) / 100);
            let nuevoEstado: LetraContrato['estado'] = letra.estado;
            if (nuevoPendiente <= 0) nuevoEstado = 'pagado';
            else if (nuevoPago > 0) nuevoEstado = 'parcial';
            return { ...letra, pago: nuevoPago, pendiente: nuevoPendiente, estado: nuevoEstado };
          });
          let sv = 0, spv = 0, lpc = 0;
          letrasActualizadas.forEach((l) => {
            if (l.estado === 'pagado') { lpc++; return; }
            if (Math.round(l.pendiente * 100) > 0) {
              const fv = l.fechaVencimiento ? new Date(l.fechaVencimiento) : null;
              if (fv && fv < hoy) sv += l.pendiente;
              else spv += l.pendiente;
            }
          });
          return {
            ...contrato,
            linea: contratoSeleccionado.linea || contrato.linea,
            letras: letrasActualizadas,
            pago: (contrato.pago || 0) + montoTotal,
            saldoVencido: sv,
            saldoPorVencer: spv,
            letrasPagadas: lpc,
            fechaUltimoPago: new Date() as any,
            montoUltimoPago: montoTotal,
          };
        });
      }

      let nuevoSaldoVencido = 0, nuevoSaldoPorVencer = 0;
      contratosActualizados.forEach((c) => {
        nuevoSaldoVencido += c.saldoVencido || 0;
        nuevoSaldoPorVencer += c.saldoPorVencer || 0;
      });
      const nuevoSaldoPendiente = contratosActualizados.reduce(
        (sum, c) => sum + ((c.totalContrato || 0) - (c.pago || 0) - (c.nc || 0)),
        0,
      );

      const saldoAnterior = contratoSeleccionado
        ? (contratoSeleccionado.totalContrato || 0)
          - (contratoSeleccionado.pago || 0)
          - (contratoSeleccionado.nc || 0)
        : cliente.saldoPendiente;
      const saldoNuevo = saldoAnterior - montoTotal;

      const datosCheque =
        formaPago === 'cheque'
          ? {
              banco: chequeBanco === 'Otros' ? chequeBancoOtro.trim() : chequeBanco,
              numeroCheque: chequeNumero.trim(),
              valor: montoTotal,
            }
          : undefined;

      // Obtener linea del cliente o de los contratos actualizados
      const contratoActualizado = contratosActualizados?.find(
        (c) => c.transaccion === contratoSeleccionado?.transaccion
      );
      const contratoLinea 
        = contratoActualizado?.linea 
        || cliente.contratos?.find((c) => c.transaccion === contratoSeleccionado?.transaccion)?.linea
        || contratoSeleccionado?.linea;

      const payload = {
        clienteId: cliente.id,
        clienteCedula: cliente.cedula,
        clienteNombre: cliente.nombre,
        monto: montoTotal,
        saldoAnterior,
        saldoNuevo,
        formaPago,
        observaciones: observaciones || undefined,
        imageUrl,
        contratoId: contratoSeleccionado?.transaccion,
        contratoReferencia: contratoSeleccionado?.referencia,
        contratoLinea,
        letrasPagadas: letrasPagadasArray,
        totalLetras: contratoSeleccionado?.totalLetras,
        datosCheque,
        tipoTarjeta: formaPago === 'tarjeta' ? tipoTarjeta : undefined,
        createdBy,
        sucursal,
        caja,
        cobrador,
        contratosActualizados,
        nuevoSaldoPendiente,
        nuevoSaldoVencido,
        nuevoSaldoPorVencer,
      };

      const res = await fetch('/api/cobros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al registrar el cobro');
      }

      // Construir cliente actualizado para refrescar la UI
      const clienteActualizado: Cliente = {
        ...cliente,
        saldoPendiente: nuevoSaldoPendiente,
        saldoVencido: nuevoSaldoVencido,
        saldoPorVencer: nuevoSaldoPorVencer,
        contratos: contratosActualizados,
      };

      onSuccess(clienteActualizado);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al procesar el pago');
    } finally {
      setProcesando(false);
    }
  };

  const letrasPendientes = useMemo(() => {
    if (!contratoSeleccionado?.letras) return [];
    return contratoSeleccionado.letras
      .filter((l) => Math.round(l.pendiente * 100) > 0)
      .sort((a, b) => a.numero - b.numero);
  }, [contratoSeleccionado]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Registrar Pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Info cliente */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="font-semibold text-blue-900 text-lg">{cliente.nombre}</p>
            <p className="text-sm text-blue-600 mt-0.5">CI: {cliente.cedula}</p>
          </div>

          {/* Resumen saldo */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {contratoSeleccionado ? 'Saldo del contrato:' : 'Saldo total:'}
              </span>
              <span className="font-bold text-gray-900">{formatCurrency(calcularSaldoTotal())}</span>
            </div>
            {contratoSeleccionado && (cliente.contratos?.length ?? 0) > 1 && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>Saldo total de todos los contratos:</span>
                <span>{formatCurrency(cliente.saldoPendiente)}</span>
              </div>
            )}
          </div>

          {/* Selector de contratos */}
          {(cliente.contratos?.length ?? 0) > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Seleccionar Contrato</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {cliente.contratos!.map((c, i) => {
                  const activo = contratoSeleccionado?.transaccion === c.transaccion;
                  return (
                    <button
                      key={`${c.transaccion}-${i}`}
                      onClick={() => seleccionarContrato(c)}
                      className={`shrink-0 rounded-xl border p-3 text-left transition-all min-w-[140px] ${
                        activo
                          ? 'bg-sky-500 border-sky-500 text-white'
                          : 'bg-white border-gray-200 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <FileText className={`h-4 w-4 ${activo ? 'text-white' : 'text-sky-500'}`} />
                        <span className={`text-sm font-semibold truncate ${activo ? 'text-white' : 'text-gray-800'}`}>
                          {c.referencia || c.transaccion}
                        </span>
                      </div>
                      {c.linea && (
                        <div className={`flex items-center gap-1.5 mb-1 ${activo ? 'text-sky-100' : 'text-gray-500'}`}>
                          <Package className="h-3 w-3 shrink-0" />
                          <p className={`text-xs truncate ${activo ? '' : 'font-medium'}`}>
                            <span className="opacity-90">Producto: </span>
                            <span className={activo ? 'font-bold' : 'text-sky-700'}>{c.linea}</span>
                          </p>
                        </div>
                      )}
                      <p className={`text-base font-bold ${activo ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency((c.totalContrato || 0) - (c.pago || 0) - (c.nc || 0))}
                      </p>
                      <p className={`text-xs mt-0.5 ${activo ? 'text-sky-100' : 'text-gray-500'}`}>
                        {c.letrasPagadas}/{c.totalLetras} letras
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selector de letras */}
          {letrasPendientes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Seleccionar Letras a Pagar ({letrasPendientes.length} disponibles)
              </p>
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {letrasPendientes.map((letra) => {
                  const seleccionada = letrasSeleccionadas.has(letra.numero);
                  const monto = letrasSeleccionadas.get(letra.numero) ?? '';
                  return (
                    <div key={letra.numero} className="bg-white">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                        onClick={() => toggleLetra(letra)}
                      >
                        <div
                          className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                            seleccionada ? 'bg-sky-500 border-sky-500' : 'border-gray-300'
                          }`}
                        >
                          {seleccionada && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {letra.numero === 0 ? 'ENTRADA' : `Letra #${letra.numero}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            Pendiente: {formatCurrency(letra.pendiente)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {letra.estado === 'vencido' && (
                            <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">VENCIDA</span>
                          )}
                          {letra.estado === 'parcial' && (
                            <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                              Pagado: {formatCurrency(letra.pago)}
                            </span>
                          )}
                        </div>
                      </button>
                      {seleccionada && (
                        <div className="px-4 pb-3 bg-sky-50">
                          <label className="text-xs text-sky-700 font-medium block mb-1">
                            Monto (Máx: {formatCurrency(letra.pendiente)}):
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={letra.pendiente}
                            step="0.01"
                            value={monto}
                            onChange={(e) => {
                              const v = e.target.value;
                              const n = parseFloat(v) || 0;
                              actualizarMontoLetra(
                                letra.numero,
                                n > letra.pendiente ? letra.pendiente.toFixed(2) : v
                              );
                            }}
                            className="w-full max-w-[160px] px-3 py-1.5 text-sm border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-white"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Forma de pago */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Forma de Pago</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { key: 'efectivo', label: 'Efectivo', icon: Banknote },
                  { key: 'transferencia', label: 'Transferencia', icon: Smartphone },
                  { key: 'cheque', label: 'Cheque', icon: FileCheck },
                  { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                ] as const
              ).map(({ key, label, icon: Icon }) => {
                const activo = formaPago === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFormaPago(key)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      activo
                        ? 'bg-sky-500 border-sky-500 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-sky-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Datos cheque */}
          {formaPago === 'cheque' && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 space-y-3">
              <p className="text-sm font-semibold text-purple-800">Datos del Cheque</p>
              <div>
                <label className="text-xs text-purple-700 font-medium block mb-1">Banco</label>
                <select
                  value={chequeBanco}
                  onChange={(e) => setChequeBanco(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="">Seleccionar banco...</option>
                  {BANCOS_ECUADOR.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              {chequeBanco === 'Otros' && (
                <div>
                  <label className="text-xs text-purple-700 font-medium block mb-1">Nombre del banco</label>
                  <input
                    type="text"
                    value={chequeBancoOtro}
                    onChange={(e) => setChequeBancoOtro(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Nombre del banco..."
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-purple-700 font-medium block mb-1">Número de cheque</label>
                <input
                  type="text"
                  value={chequeNumero}
                  onChange={(e) => setChequeNumero(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Número de cheque..."
                />
              </div>
            </div>
          )}

          {/* Datos tarjeta */}
          {formaPago === 'tarjeta' && (
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <label className="text-xs text-orange-700 font-medium block mb-1">Tipo de tarjeta</label>
              <select
                value={tipoTarjeta}
                onChange={(e) => setTipoTarjeta(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              >
                <option value="">Seleccionar tipo...</option>
                {TIPOS_TARJETA.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent resize-none"
              placeholder="Agregar nota o comentario..."
            />
          </div>

          {/* Imagen */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Foto comprobante <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Comprobante"
                  className="w-full max-h-48 object-cover rounded-xl border border-gray-200"
                />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center gap-2 text-gray-400 hover:border-sky-300 hover:text-sky-500 transition-colors"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">Seleccionar imagen</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Saldo restante */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            {letrasSeleccionadas.size > 0 && (
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                <span className="text-sm font-semibold text-blue-700">
                  Total a cobrar ({letrasSeleccionadas.size} {letrasSeleccionadas.size === 1 ? 'letra' : 'letras'}):
                </span>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(calcularMontoSeleccionado())}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monto seleccionado:</span>
              <span className="font-bold text-gray-900">{formatCurrency(calcularMontoSeleccionado())}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">Saldo restante:</span>
              <span
                className={`text-lg font-bold ${
                  calcularSaldoRestante() === 0 ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {formatCurrency(calcularSaldoRestante())}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={procesarPago}
            disabled={procesando || uploadingImage}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 rounded-xl transition-colors text-base"
          >
            {procesando || uploadingImage ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {uploadingImage ? 'Subiendo imagen...' : 'Procesando...'}
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Confirmar Pago
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CobrarPage() {
  const [todos, setTodos] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [clienteCobro, setClienteCobro] = useState<Cliente | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const cargarClientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/clientes');
      if (!res.ok) throw new Error('Error al cargar clientes');
      const data = await res.json();
      setTodos(agruparClientesPorCedula(data.clientes || []));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarClientes(); }, [cargarClientes]);

  const filtrados = useMemo(() => {
    if (!searchQuery.trim()) return todos;
    const lower = searchQuery.toLowerCase().trim();
    return todos.filter(
      (c) => c.nombre.toLowerCase().includes(lower) || c.cedula.includes(searchQuery.trim())
    );
  }, [todos, searchQuery]);

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const clientesPagina = filtrados.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleToggleExpand = useCallback(
    (id: string) => setExpandedId((prev) => (prev === id ? null : id)),
    []
  );

  const handleCobrar = useCallback((cliente: Cliente) => {
    if (cliente.saldoPendiente <= 0) return;
    setClienteCobro(cliente);
  }, []);

  const handlePagoExitoso = useCallback(
    (clienteActualizado: Cliente) => {
      setTodos((prev) =>
        prev.map((c) => (c.id === clienteActualizado.id ? clienteActualizado : c))
      );
      setClienteCobro(null);
      setExpandedId(null);
      setSuccessMsg(`Pago registrado correctamente para ${clienteActualizado.nombre}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cobrar</h1>
          <p className="mt-1 text-sm text-gray-600">
            {loading ? 'Cargando clientes...' : `${filtrados.length} cliente${filtrados.length !== 1 ? 's' : ''} encontrado${filtrados.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={cargarClientes}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm">
          <Check className="h-5 w-5 text-green-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Estados */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-700 font-medium">Error: {error}</p>
          <button onClick={cargarClientes} className="mt-3 text-sm text-red-600 underline hover:no-underline">
            Reintentar
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <User className="h-14 w-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </p>
          {searchQuery && (
            <p className="text-gray-400 text-sm mt-1">Prueba con otro nombre o cédula</p>
          )}
        </div>
      ) : (
        <>
          {/* Grid de clientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {clientesPagina.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                isExpanded={expandedId === cliente.id}
                onToggleExpand={handleToggleExpand}
                onCobrar={handleCobrar}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-600">
                Mostrando {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filtrados.length)} de{' '}
                {filtrados.length} clientes
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Páginas */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 py-1 text-gray-400 text-sm">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item as number)}
                        className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === item
                            ? 'bg-sky-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de cobro */}
      {clienteCobro && (
        <CobroModal
          cliente={clienteCobro}
          onClose={() => setClienteCobro(null)}
          onSuccess={handlePagoExitoso}
        />
      )}
    </div>
  );
}
