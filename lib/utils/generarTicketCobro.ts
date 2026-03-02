import { Cobro } from '@/lib/types';
import { LOGO_BASE64 } from '@/lib/logoBase64';

/**
 * Normaliza cualquier formato de fecha de Firestore/JS a Date
 */
const normFecha = (date: any): Date => {
  if (!date) return new Date();
  if (date?.toDate && typeof date.toDate === 'function') return date.toDate();
  if (date?._seconds) return new Date(date._seconds * 1000);
  return new Date(date);
};

/**
 * Genera el HTML del ticket de cobro (igual al de la app móvil) y lo abre
 * en una ventana nueva para imprimirlo o guardarlo como PDF.
 */
export function imprimirTicketCobro(cobro: Cobro): void {
  const fecha = normFecha(cobro.fecha);

  const fechaStr = fecha.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaStr = fecha.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const numComprobante = cobro.numeroComprobante || '—';

  const formaPagoTexto =
    cobro.formaPago === 'efectivo' ? 'EFECTIVO'
    : cobro.formaPago === 'transferencia' ? 'TRANSFERENCIA'
    : cobro.formaPago === 'cheque' ? 'CHEQUE'
    : 'TARJETA';

  const montoPagado = cobro.monto || 0;
  const saldoRestante = cobro.saldoNuevo ?? 0;
  const usuarioNombre = cobro.createdBy || 'RECAUDADOR';

  // Sección de cuotas/letra
  let seccionCuotas = '';
  if (cobro.letrasPagadas && cobro.letrasPagadas.length > 0) {
    const items = cobro.letrasPagadas
      .map(
        (lp) =>
          `<div class="detalle-row"><span>${lp.numero === 0 ? 'ENTRADA' : `${String(lp.numero).padStart(2, '0')}/58`}: ${lp.monto.toFixed(2)} USD</span></div>`
      )
      .join('');
    seccionCuotas = `
      <div class="linea-puntos"></div>
      <div class="seccion-titulo">CUOTAS PAGADAS:</div>
      ${items}
    `;
  } else if (cobro.numeroLetra !== undefined && cobro.numeroLetra !== null) {
    const numLetraStr =
      cobro.numeroLetra === 0
        ? 'ENTRADA'
        : `${String(cobro.numeroLetra).padStart(2, '0')}/58`;
    seccionCuotas = `
      <div class="linea-puntos"></div>
      <div class="seccion-titulo">CUOTA:</div>
      <div class="detalle-row"><span>${numLetraStr}</span></div>
    `;
  }

  // Sección de contrato
  const seccionContrato = cobro.contratoId
    ? `
      <div class="linea-puntos"></div>
      <div class="seccion-titulo">CONTRATO:</div>
      <div class="info-row">${cobro.contratoReferencia || cobro.contratoId}</div>
    `
    : '';

  // Sección de cheque
  const seccionCheque =
    cobro.formaPago === 'cheque' && cobro.datosCheque
      ? `
      <div class="linea-puntos"></div>
      <div class="seccion-titulo">DATOS DEL CHEQUE:</div>
      <div class="info-row">Banco: ${cobro.datosCheque.banco}</div>
      <div class="info-row">N° Cheque: ${cobro.datosCheque.numeroCheque}</div>
      <div class="info-row">Valor: ${cobro.datosCheque.valor.toFixed(2)} USD</div>
    `
      : '';

  // Sección de observaciones
  const seccionObs = cobro.observaciones
    ? `
      <div class="linea-puntos"></div>
      <div class="seccion-titulo">OBSERVACIONES:</div>
      <div class="info-row">${cobro.observaciones}</div>
    `
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=76mm">
  <title>Ticket de Cobro - ${cobro.clienteNombre}</title>
  <style>
    @page { size: 76mm auto; margin: 0mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      width: 76mm;
      padding: 3mm 2mm;
      background: white;
      color: black;
    }
    .linea-puntos { border-top: 1px dashed #666; margin: 3mm 0; }
    .header { text-align: center; margin-bottom: 3mm; }
    .logo-img { max-width: 68mm; height: auto; margin: 0 auto 2mm auto; display: block; }
    .num-comprobante { font-size: 8pt; margin: 1mm 0; }
    .fecha-emision { font-size: 8pt; margin: 2mm 0; }
    .seccion-titulo { font-size: 9pt; font-weight: bold; margin: 3mm 0 2mm 0; text-transform: uppercase; }
    .cliente-nombre { font-size: 9pt; font-weight: bold; word-wrap: break-word; }
    .info-row { font-size: 9pt; margin: 1mm 0; }
    .detalle-row { font-size: 9pt; margin: 2mm 0; display: flex; justify-content: space-between; }
    .total-row { font-size: 10pt; font-weight: bold; margin: 2mm 0; }
    .forma-pago { font-size: 9pt; margin-top: 3mm; }
    .forma-pago-titulo { font-weight: bold; }
    .firma-seccion { margin-top: 5mm; text-align: center; }
    .firma-linea { border-top: 1px solid #000; width: 80%; margin: 8mm auto 1mm auto; }
    .firma-texto { font-size: 8pt; margin: 1mm 0; }
    .footer { text-align: center; margin-top: 5mm; font-size: 10pt; font-weight: bold; }

    /* Estilos de impresión: ocultar todo excepto el ticket */
    @media print {
      body { width: 76mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${LOGO_BASE64 ? `<img src="${LOGO_BASE64}" class="logo-img" alt="Logo">` : ''}
    <div class="linea-puntos"></div>
    <div class="num-comprobante">NUM. COMPROBANTE: ${numComprobante}</div>
    <div class="fecha-emision">FECHA DE EMISION: ${fechaStr} ${horaStr}</div>
  </div>
  <div class="linea-puntos"></div>
  <div class="seccion-titulo">CLIENTE:</div>
  <div class="cliente-nombre">${cobro.clienteNombre}</div>
  <div class="info-row">C.I: ${cobro.clienteCedula}</div>
  ${seccionContrato}
  ${seccionCuotas}
  <div class="linea-puntos"></div>
  <div class="total-row">TOTAL COBRADO:</div>
  <div class="total-row">${montoPagado.toFixed(2)} USD</div>
  <div class="forma-pago">
    <span class="forma-pago-titulo">FORMA DE PAGO:</span><br>
    ${formaPagoTexto}: ${montoPagado.toFixed(2)} USD
  </div>
  ${seccionCheque}
  <div class="linea-puntos"></div>
  <div class="info-row" style="display:flex;justify-content:space-between;font-size:9pt;margin:2mm 0;">
    <span style="font-weight:bold;">SALDO ANTERIOR:</span>
    <span style="font-weight:bold;">${(cobro.saldoAnterior ?? 0).toFixed(2)} USD</span>
  </div>
  <div class="info-row" style="display:flex;justify-content:space-between;font-size:9pt;margin:2mm 0;">
    <span style="font-weight:bold;">SALDO PENDIENTE:</span>
    <span style="font-weight:bold;">${saldoRestante.toFixed(2)} USD</span>
  </div>
  ${seccionObs}
  <div class="firma-seccion">
    <div class="firma-linea"></div>
    <div class="firma-texto">F. CLIENTE</div>
    <div class="firma-texto">${cobro.clienteNombre}</div>
    <div class="firma-linea" style="margin-top:5mm;"></div>
    <div class="firma-texto">F. ${usuarioNombre.toUpperCase()}</div>
  </div>
  <div class="linea-puntos"></div>
  <div class="footer">GRACIAS POR SU PAGO!</div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=350,height=600,scrollbars=yes');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
