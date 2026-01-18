// Tipos de datos para el sistema

export interface Cobrador {
  id?: string;
  codigo: string;
  cobrador: string;
  estado: 'A' | 'I' | '1' | '0' | 1 | 0;
  periodo: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Usuario {
  id?: string;
  usuario: string;
  clave: string;
  codigo: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UsuarioPermiso {
  id?: string;
  periodo: string;
  usuario: string;
  autorizado: 'S' | 'N';
  inventario?: 'S' | 'N';
  facturacion?: 'S' | 'N';
  cartera?: 'S' | 'N';
  bancos?: 'S' | 'N';
  contabilidad?: 'S' | 'N';
  dimm?: 'S' | 'N';
  compras?: 'S' | 'N';
  depositos?: 'S' | 'N';
  gastos?: 'S' | 'N';
  debitoCreditos?: 'S' | 'N';
  productos?: 'S' | 'N';
  codigo?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Cliente {
  id?: string;
  cedula: string;
  nombre: string;
  telefono: string;
  direccion: string;
  saldoPendiente: number;
  saldoVencido: number;
  saldoPorVencer: number;
  totalContratos: number;
  contratos?: ContratoCliente[];
  diasMora?: number;
  estadoMora?: string;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContratoCliente {
  transaccion: string;
  tipoDoc: string;
  fechaEmision: Date;
  referencia?: string;
  totalContrato: number;
  saldoVencido: number;
  saldoPorVencer: number;
  totalLetras: number;
  letrasPagadas: number;
  fechaUltimoPago?: Date;
  fechaVencimiento?: Date;
  diasMora: number;
  estadoMora: string;
  montoUltimoPago?: number;
}

export interface DashboardStats {
  totalClientes: number;
  totalCobradores: number;
  totalUsuarios: number;
  clientesConDeuda: number;
  saldoTotal: number;
  saldoVencido: number;
}

export interface Cobro {
  id?: string;
  clienteId: string;
  clienteCedula: string;
  clienteNombre: string;
  contratoId?: string;
  contratoReferencia?: string;
  numeroLetra?: number;
  letrasPagadas?: Array<{ numero: number; monto: number }>;
  numeroComprobante?: string;
  monto: number;
  saldoAnterior: number;
  saldoNuevo: number;
  formaPago: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
  fecha: Date;
  imageUrl?: string;
  observaciones?: string;
  latitude?: number;
  longitude?: number;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  syncStatus?: 'pending' | 'synced' | 'error';
  offlineSync?: boolean;
}

export interface EncajeCaja {
  id?: string;
  usuarioNombre: string;
  fecha: Date;
  efectivo: number;
  transferencia: number;
  totalDeclarado: number;
  totalCobrado: number;
  efectivoCobrado: number;
  transferenciaCobrado: number;
  diferencia: number;
  observaciones?: string;
  createdAt?: Date;
  updatedAt?: Date;
  syncStatus?: 'pending' | 'synced' | 'error';
}

export interface ActividadReciente {
  id: string;
  tipo: 'cobro' | 'encaje';
  usuario: string;
  monto: number;
  clienteNombre?: string;
  fecha: Date;
  formaPago?: string;
  diferencia?: number;
}

export interface EstadisticasCobros {
  totalCobrado: number;
  totalEfectivo: number;
  totalTransferencias: number;
  cantidadCobros: number;
  topCobradores: Array<{
    usuario: string;
    total: number;
    cantidad: number;
  }>;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'admin' | 'cobrador';
}
