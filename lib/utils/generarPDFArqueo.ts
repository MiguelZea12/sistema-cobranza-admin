import { EncajeCaja } from '@/lib/types';

// SVG icons (inline, no dependencies)
const ICON_COMPARE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>`;
const ICON_MONEY   = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
const ICON_CLIP    = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M16 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>`;
const ICON_NOTE    = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

/**
 * Formatea un número como moneda USD
 */
const fmt = (n: number) =>
  new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

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
 * Genera el HTML completo del reporte de arqueo y lo abre en una ventana nueva
 * para que el usuario pueda imprimirlo o guardarlo como PDF desde el navegador.
 */
export function imprimirArqueo(encaje: EncajeCaja): void {
  const fecha = normFecha(encaje.fecha);
  const fechaStr = fecha.toLocaleDateString('es-EC', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
  const horaStr = fecha.toLocaleTimeString('es-EC', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  // ── Desglose de efectivo ──────────────────────────────────────────────────
  const dsg = encaje.desglose;
  const filasBilletes = dsg
    ? [
        { label: '$100', cant: dsg.billetes.cien,      val: dsg.billetes.cien * 100 },
        { label: '$50',  cant: dsg.billetes.cincuenta, val: dsg.billetes.cincuenta * 50 },
        { label: '$20',  cant: dsg.billetes.veinte,    val: dsg.billetes.veinte * 20 },
        { label: '$10',  cant: dsg.billetes.diez,      val: dsg.billetes.diez * 10 },
        { label: '$5',   cant: dsg.billetes.cinco,     val: dsg.billetes.cinco * 5 },
        { label: '$1',   cant: dsg.billetes.uno,       val: dsg.billetes.uno * 1 },
      ].filter(f => f.cant > 0)
    : [];

  const filasMonedas = dsg
    ? [
        { label: '$1.00', cant: dsg.monedas.un_dolar,             val: dsg.monedas.un_dolar * 1 },
        { label: '$0.50', cant: dsg.monedas.cincuenta_centavos,   val: dsg.monedas.cincuenta_centavos * 0.5 },
        { label: '$0.25', cant: dsg.monedas.veinticinco_centavos, val: dsg.monedas.veinticinco_centavos * 0.25 },
        { label: '$0.10', cant: dsg.monedas.diez_centavos,        val: dsg.monedas.diez_centavos * 0.1 },
        { label: '$0.05', cant: dsg.monedas.cinco_centavos,       val: dsg.monedas.cinco_centavos * 0.05 },
        { label: '$0.01', cant: dsg.monedas.un_centavo,           val: dsg.monedas.un_centavo * 0.01 },
      ].filter(f => f.cant > 0)
    : [];

  const renderFilasDenominacion = (filas: { label: string; cant: number; val: number }[]) =>
    filas.length === 0
      ? `<tr><td colspan="3" class="text-muted">Sin denominaciones registradas</td></tr>`
      : filas
          .map(
            f => `
          <tr>
            <td>${f.label}</td>
            <td class="center">${f.cant}</td>
            <td class="right">$${fmt(f.val)}</td>
          </tr>`
          )
          .join('');

  // ── Cheques ───────────────────────────────────────────────────────────────
  const cheques = encaje.cheques ?? [];
  const filasChequesHtml =
    cheques.length === 0
      ? '<tr><td colspan="3" class="text-muted">Sin cheques</td></tr>'
      : cheques
          .map(
            (c, i) => `
          <tr>
            <td>${i + 1}. ${c.banco}</td>
            <td class="center">N°${c.numeroCheque}</td>
            <td class="right">$${fmt(c.valor)}</td>
          </tr>`
          )
          .join('');

  // ── Diferencia ─────────────────────────────────────────────────────────────
  const difColor =
    encaje.diferencia > 0 ? '#15803d' : encaje.diferencia < 0 ? '#dc2626' : '#1d4ed8';
  const difLabel =
    encaje.diferencia > 0 ? 'SOBRANTE' : encaje.diferencia < 0 ? 'FALTANTE' : 'EXACTO';
  const difBg =
    encaje.diferencia > 0 ? '#f0fdf4' : encaje.diferencia < 0 ? '#fef2f2' : '#eff6ff';
  const difBorder =
    encaje.diferencia > 0 ? '#86efac' : encaje.diferencia < 0 ? '#fca5a5' : '#93c5fd';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte Arqueo – ${encaje.usuarioNombre} – ${fecha.toLocaleDateString('es-EC')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #1e293b;
      background: #fff;
      width: 794px;
      padding: 28px 32px;
    }

    /* ─── Header ─────────────────────────────── */
    .header {
      display: flex; align-items: flex-start; justify-content: space-between;
      border-bottom: 3px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px;
    }
    .header-left h1 { font-size: 24px; font-weight: 800; color: #1e293b; }
    .header-left .sub { font-size: 13px; color: #64748b; margin-top: 3px; }
    .header-right { text-align: right; }
    .header-right .doc-tipo {
      background: #2563eb; color: #fff;
      font-size: 15px; font-weight: 700; padding: 5px 16px; border-radius: 6px;
    }
    .header-right .doc-fecha { font-size: 11px; color: #64748b; margin-top: 5px; }

    /* ─── Info bloques ───────────────────────── */
    .info-block {
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      gap: 14px; margin-bottom: 20px;
    }
    .info-card {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 10px 14px;
    }
    .info-card label { font-size: 10px; font-weight: 700; text-transform: uppercase;
      color: #94a3b8; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
    .info-card .val { font-size: 16px; font-weight: 700; color: #1e293b; }

    /* ─── Tabla comparativa ───────────────────── */
    .comparativa {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
      overflow: hidden; margin-bottom: 20px;
    }
    .comparativa-header {
      background: #1e293b; color: #fff; padding: 9px 14px;
      font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .comp-grid {
      display: grid; grid-template-columns: 1fr 1fr; 
    }
    .comp-col { padding: 14px 16px; }
    .comp-col:first-child { border-right: 1px solid #e2e8f0; }
    .comp-col h3 { font-size: 12px; font-weight: 700; text-transform: uppercase;
      color: #64748b; letter-spacing: 0.5px; margin-bottom: 10px; }
    .comp-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
    .comp-row span:first-child { color: #475569; }
    .comp-row span:last-child { font-weight: 600; color: #1e293b; }
    .comp-row.total {
      border-top: 1.5px solid #e2e8f0; padding-top: 7px; margin-top: 5px;
      font-weight: 800; font-size: 15px;
    }
    .comp-row.total span { color: #1e293b; }

    /* ─── Resultado diferencia ────────────────── */
    .diferencia-box {
      background: ${difBg}; border: 2px solid ${difBorder};
      border-radius: 10px; padding: 14px 20px; margin-bottom: 20px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .dif-label { font-size: 18px; font-weight: 800; color: ${difColor}; }
    .dif-valor { font-size: 28px; font-weight: 900; color: ${difColor}; }

    /* ─── Tabla desglose ──────────────────────── */
    .section-title {
      font-size: 14px; font-weight: 700; color: #1e293b;
      text-transform: uppercase; letter-spacing: 0.5px;
      border-left: 4px solid #2563eb; padding-left: 10px;
      margin-bottom: 10px; margin-top: 18px;
    }
    table {
      width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px;
    }
    thead th {
      background: #f1f5f9; color: #475569; font-weight: 700;
      padding: 8px 12px; text-align: left; font-size: 12px;
      text-transform: uppercase; letter-spacing: 0.4px;
    }
    thead th.center { text-align: center; }
    thead th.right { text-align: right; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 7px 12px; color: #334155; border-bottom: 1px solid #f1f5f9; }
    tbody td.center { text-align: center; }
    tbody td.right { text-align: right; font-weight: 600; }
    tbody td.text-muted { color: #94a3b8; font-style: italic; }
    tfoot td {
      background: #eff6ff; font-weight: 800; font-size: 14px;
      padding: 8px 12px; color: #1d4ed8; border-top: 2px solid #bfdbfe;
    }
    tfoot td.right { text-align: right; }

    /* ─── Observaciones ───────────────────────── */
    .observaciones {
      background: #fefce8; border: 1px solid #fde68a;
      border-radius: 8px; padding: 12px 16px; margin-top: 10px;
      font-size: 13px; color: #78350f;
    }
    .observaciones strong { display: block; margin-bottom: 4px; color: #92400e; }

    /* ─── Footer ──────────────────────────────── */
    .footer {
      margin-top: 28px; border-top: 1px solid #e2e8f0;
      padding-top: 10px; text-align: center;
      font-size: 11px; color: #94a3b8;
    }

    /* ─── Estilos de impresión ─────────────────── */
    @media print {
      @page { margin: 15mm 14mm; size: A4 portrait; }
      body { width: 100%; padding: 0; margin: 0; }
      .header-right .doc-tipo { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .comparativa-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .diferencia-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tfoot td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .info-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .observaciones { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- ENCABEZADO -->
  <div class="header">
    <div class="header-left">
      <h1>Sistema de Cobranza</h1>
      <p class="sub">Reporte de Arqueo de Caja</p>
    </div>
    <div class="header-right">
      <div class="doc-tipo">ARQUEO DE CAJA</div>
      <div class="doc-fecha">Generado: ${new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  </div>

  <!-- INFO GENERAL -->
  <div class="info-block">
    <div class="info-card">
      <label>Usuario / Cobrador</label>
      <div class="val">${encaje.usuarioNombre}</div>
    </div>
    <div class="info-card">
      <label>Fecha del Arqueo</label>
      <div class="val" style="font-size:12px;">${fechaStr}</div>
    </div>
    <div class="info-card">
      <label>Hora de registro</label>
      <div class="val">${horaStr}</div>
    </div>
  </div>

  <!-- COMPARATIVA COBRADO vs DECLARADO -->
  <div class="comparativa">
    <div class="comparativa-header">${ICON_COMPARE} Comparativa: Cobrado vs. Declarado</div>
    <div class="comp-grid">
      <div class="comp-col">
        <h3>${ICON_MONEY} Total Cobrado (Sistema)</h3>
        <div class="comp-row"><span>Efectivo cobrado:</span><span>$${fmt(encaje.efectivoCobrado)}</span></div>
        <div class="comp-row"><span>Transferencia cobrada:</span><span>$${fmt(encaje.transferenciaCobrado)}</span></div>
        ${(encaje.chequeCobrado ?? 0) > 0 ? `<div class="comp-row"><span>Cheques cobrados:</span><span>$${fmt(encaje.chequeCobrado ?? 0)}</span></div>` : ''}
        ${(encaje.tarjetaCobrado ?? 0) > 0 ? `<div class="comp-row"><span>Tarjeta cobrada:</span><span>$${fmt(encaje.tarjetaCobrado ?? 0)}</span></div>` : ''}
        <div class="comp-row total"><span>TOTAL COBRADO:</span><span>$${fmt(encaje.totalCobrado)}</span></div>
      </div>
      <div class="comp-col">
        <h3>${ICON_CLIP} Total Declarado (Cobrador)</h3>
        <div class="comp-row"><span>Efectivo declarado:</span><span>$${fmt(encaje.efectivo)}</span></div>
        <div class="comp-row"><span>Transferencia declarada:</span><span>$${fmt(encaje.transferencia)}</span></div>
        ${(encaje.totalCheques ?? 0) > 0 ? `<div class="comp-row"><span>Cheques declarados:</span><span>$${fmt(encaje.totalCheques ?? 0)}</span></div>` : ''}
        ${(encaje.tarjeta ?? 0) > 0 ? `<div class="comp-row"><span>Tarjeta declarada:</span><span>$${fmt(encaje.tarjeta ?? 0)}</span></div>` : ''}
        <div class="comp-row total"><span>TOTAL DECLARADO:</span><span>$${fmt(encaje.totalDeclarado)}</span></div>
      </div>
    </div>
  </div>

  <!-- DIFERENCIA -->
  <div class="diferencia-box">
    <div>
      <div style="font-size:10px;font-weight:600;color:${difColor};letter-spacing:0.5px;text-transform:uppercase;">Resultado del Arqueo</div>
      <div class="dif-label">${difLabel}</div>
    </div>
    <div class="dif-valor">$${fmt(Math.abs(encaje.diferencia))}</div>
  </div>

  <!-- DESGLOSE EFECTIVO: BILLETES -->
  ${dsg ? `
  <div class="section-title">Desglose de Efectivo — Billetes</div>
  <table>
    <thead>
      <tr>
        <th>Denominación</th>
        <th class="center">Cantidad</th>
        <th class="right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${renderFilasDenominacion(filasBilletes)}</tbody>
    <tfoot>
      <tr>
        <td colspan="2"><strong>Total Billetes</strong></td>
        <td class="right">$${fmt(filasBilletes.reduce((s, f) => s + f.val, 0))}</td>
      </tr>
    </tfoot>
  </table>

  <div class="section-title">Desglose de Efectivo — Monedas</div>
  <table>
    <thead>
      <tr>
        <th>Denominación</th>
        <th class="center">Cantidad</th>
        <th class="right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${renderFilasDenominacion(filasMonedas)}</tbody>
    <tfoot>
      <tr>
        <td colspan="2"><strong>Total Monedas</strong></td>
        <td class="right">$${fmt(filasMonedas.reduce((s, f) => s + f.val, 0))}</td>
      </tr>
    </tfoot>
  </table>
  ` : `<p style="color:#94a3b8;font-style:italic;margin-bottom:16px;">Sin desglose de denominaciones registrado.</p>`}

  <!-- CHEQUES -->
  <div class="section-title">Cheques Recibidos</div>
  <table>
    <thead>
      <tr>
        <th>Banco</th>
        <th class="center">N° Cheque</th>
        <th class="right">Valor</th>
      </tr>
    </thead>
    <tbody>${filasChequesHtml}</tbody>
    ${cheques.length > 0 ? `
    <tfoot>
      <tr>
        <td colspan="2"><strong>Total Cheques</strong></td>
        <td class="right">$${fmt(encaje.totalCheques ?? 0)}</td>
      </tr>
    </tfoot>` : ''}
  </table>

  <!-- OBSERVACIONES -->
  ${encaje.observaciones ? `
  <div class="observaciones">
    <strong>${ICON_NOTE} Observaciones</strong>
    ${encaje.observaciones}
  </div>` : ''}

  <!-- FOOTER -->
  <div class="footer">
    Reporte generado automáticamente por el Sistema de Cobranza &nbsp;·&nbsp; ${new Date().toLocaleDateString('es-EC')}
  </div>

</body>
</html>`;

  // ── Abrir en ventana nueva y usar el diálogo de impresión del navegador ──
  // (elimina los problemas de posicionamiento de html2canvas con iframe)
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Por favor, permite las ventanas emergentes para generar el PDF.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();

  // Esperar a que los estilos y el DOM terminen de cargarse antes de imprimir
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 400);
  };
}
