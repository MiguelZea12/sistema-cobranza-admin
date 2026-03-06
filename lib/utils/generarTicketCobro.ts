import { Cobro } from '@/lib/types';
import { LOGO_BASE64 } from '@/lib/logoBase64';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const normFecha = (date: any): Date => {
  if (!date) return new Date();
  if (date?.toDate && typeof date.toDate === 'function') return date.toDate();
  if (date?._seconds) return new Date(date._seconds * 1000);
  return new Date(date);
};

function buildTicketHTML(cobro: Cobro): string {
  const fecha = normFecha(cobro.fecha);
  const fechaStr = fecha.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaStr  = fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const numComprobante = cobro.numeroComprobante || '---';
  const formaPagoTexto =
    cobro.formaPago === 'efectivo'        ? 'EFECTIVO'
    : cobro.formaPago === 'transferencia' ? 'TRANSFERENCIA'
    : cobro.formaPago === 'cheque'        ? 'CHEQUE'
    : 'TARJETA';

  const montoPagado   = cobro.monto ?? 0;
  const saldoRestante = cobro.saldoNuevo ?? 0;
  const usuarioNombre = cobro.createdBy || 'RECAUDADOR';

  const seccionContrato = cobro.contratoId
    ? `<div class="linea-puntos"></div>
      <div class="seccion-titulo">CONTRATO:</div>
      <div class="info-row">${cobro.contratoReferencia || cobro.contratoId}</div>`
    : '';

  let seccionCuotas = '';
  const totalLetras = cobro.totalLetras || 58;
  if (cobro.letrasPagadas && cobro.letrasPagadas.length > 0) {
    const items = cobro.letrasPagadas
      .map(lp => `<div class="detalle-row"><span>${lp.numero === 0 ? 'ENTRADA' : String(lp.numero).padStart(2,'0')+'/'+totalLetras}: ${lp.monto.toFixed(2)} USD</span></div>`)
      .join('');
    seccionCuotas = `<div class="linea-puntos"></div>
      <div class="seccion-titulo">CUOTAS PAGADAS:</div>
      ${items}`;
  } else if (cobro.numeroLetra !== undefined && cobro.numeroLetra !== null) {
    const label = cobro.numeroLetra === 0 ? 'ENTRADA' : String(cobro.numeroLetra).padStart(2,'0')+'/'+totalLetras;
    seccionCuotas = `<div class="linea-puntos"></div>
      <div class="seccion-titulo">CUOTA:</div>
      <div class="detalle-row"><span>${label}</span></div>`;
  }

  // HTML idéntico al html76 de la app móvil
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=76mm">
  <style>
    @page { size: 76mm auto; margin: 0mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .ticket-wrapper { font-family: 'Courier New', monospace; font-size: 10px; width: 76mm; padding: 4mm 5mm 8mm 5mm; background: white; color: black; }
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
    .footer { text-align: center; margin-top: 5mm; margin-bottom: 6mm; font-size: 10pt; font-weight: bold; }
  </style>
</head>
<body>
<div class="ticket-wrapper">
  <div class="header">
    ${LOGO_BASE64 ? '<img src="' + LOGO_BASE64 + '" class="logo-img" alt="Logo">' : ''}
    <div class="linea-puntos"></div>
    <div class="num-comprobante">NUM. COMPROBANTE: ${numComprobante}</div>
    <div class="fecha-emision">FECHA DE EMISION: ${fechaStr} ${horaStr}</div>
  </div>
  <div class="linea-puntos"></div>
  <div class="seccion-titulo">CLIENTE:</div>
  <div class="cliente-nombre">${cobro.clienteNombre}</div>
  ${seccionContrato}
  ${seccionCuotas}
  <div class="linea-puntos"></div>
  <div class="total-row">TOTAL COBRADO:</div>
  <div class="total-row">${montoPagado.toFixed(2)} USD</div>
  <div class="forma-pago">
    <span class="forma-pago-titulo">FORMA DE PAGO:</span><br>
    ${formaPagoTexto}: ${montoPagado.toFixed(2)} USD
  </div>
  <div class="linea-puntos"></div>
  <div class="info-row" style="display:flex;justify-content:space-between;font-size:9pt;margin:2mm 0;">
    <span style="font-weight:bold;">SALDO PENDIENTE:</span>
    <span style="font-weight:bold;">${saldoRestante.toFixed(2)} USD</span>
  </div>
  <div class="firma-seccion">
    <div class="firma-linea"></div>
    <div class="firma-texto">F. CLIENTE</div>
    <div class="firma-texto">${cobro.clienteNombre}</div>
    <div class="firma-linea" style="margin-top:5mm;"></div>
    <div class="firma-texto">F. ${usuarioNombre}</div>
  </div>
  <div class="linea-puntos"></div>
  <div class="footer">GRACIAS POR SU PAGO!</div>
</div>
</body>
</html>`;
}

export async function imprimirTicketCobro(cobro: Cobro): Promise<void> {
  // 76mm a 96dpi = 287px — coincide exactamente con el body { width: 76mm } del HTML
  const PX_WIDTH = 287;

  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-9999px;top:0;width:${PX_WIDTH}px;background:#fff;`;
  container.innerHTML = buildTicketHTML(cobro);
  document.body.appendChild(container);

  const img = container.querySelector('img');
  if (img) {
    await new Promise<void>(resolve => {
      if (img.complete) { resolve(); return; }
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  }

  try {
    // scale:4 → canvas de ~1148px de ancho = alta resolución para un PDF de 76mm
    const canvas = await html2canvas(container, {
      scale: 4,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: PX_WIDTH,
      windowWidth: PX_WIDTH,
    });

    const imgData = canvas.toDataURL('image/png');

    // PDF exactamente de 76mm de ancho, alto proporcional al contenido (sin espacio en blanco)
    const widthMm  = 76;
    const heightMm = (canvas.height / canvas.width) * widthMm;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [widthMm, heightMm],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);
    pdf.save(`ticket_${cobro.numeroComprobante || cobro.id || 'cobro'}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
