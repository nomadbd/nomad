import { Order } from './messageUtils';

export const printInvoice = (placedOrderDetails: any) => {
  if (!placedOrderDetails) return;

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const printWindow = window.open('', '_blank', 'width=850,height=900,left=150,top=50');
  if (!printWindow) {
    return;
  }

  const itemsHtml = (placedOrderDetails.items || []).map((item: any) => {
    const detailsArray = [];
    if (item.size) detailsArray.push(`SIZE: ${String(item.size).toUpperCase()}`);
    if (item.color) detailsArray.push(`COLOR: ${String(item.color).toUpperCase()}`);
    detailsArray.push(`QTY: ${item.quantity}`);

    return `
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; letter-spacing: 1px; line-height: 1.6; color: #000;">
          <strong style="color: #000; display: block; margin-bottom: 4px;">${item.name ? String(item.name).toUpperCase() : ''}</strong>
          <div style="color: #555; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase;">
            ${detailsArray.join(' &nbsp;|&nbsp; ')} &nbsp;&bull;&nbsp; ৳${item.price}
          </div>
        </td>
        <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; text-align: right; font-family: monospace; vertical-align: bottom; color: #000;">৳${item.price * item.quantity}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Invoice #${String(placedOrderDetails.orderId || '').slice(0, 8)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #000; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 11px; background: #fff; box-sizing: border-box; }
        .header { text-align: center; margin-bottom: 10px; letter-spacing: 6px; font-weight: bold; font-size: 22px; color: #000; }
        .sub-header { text-align: center; font-size: 10px; letter-spacing: 3px; color: #666; margin-bottom: 50px; text-transform: uppercase; }
        .info-table { width: 100%; margin-bottom: 40px; font-size: 11px; letter-spacing: 0.5px; border-collapse: collapse; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        .summary-table { width: 40%; margin-left: auto; font-size: 11px; line-height: 2; letter-spacing: 0.5px; margin-bottom: 60px; }
        .disclaimer { font-size: 9px; color: #777; line-height: 1.6; text-align: center; border-top: 1px solid #eee; padding-top: 20px; letter-spacing: 0.5px; }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">NOMAD</div>
      <div class="sub-header">Proforma Invoice / Order Memorandum</div>

      <table class="info-table">
        <tr>
          <td style="width: 50%; padding: 4px 0; vertical-align: top; color: #000; font-size: 11px;">
            <span style="color: #666; font-size: 9px; letter-spacing: 1.5px; font-weight: bold; display: block;">SHIPPING TO</span>
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000; font-size: 11px; letter-spacing: 0.5px;">
            <strong>ORDER ID:</strong> #${placedOrderDetails.orderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">
            ${placedOrderDetails.customerName ? String(placedOrderDetails.customerName).toUpperCase() : 'GUEST'}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000; font-size: 11px; letter-spacing: 0.5px;">
            <strong>DATE:</strong> ${formattedDate} &nbsp;&nbsp; <strong>TIME:</strong> ${formattedTime}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000; font-size: 11px; letter-spacing: 0.5px;">
            ${placedOrderDetails.customerPhone || ''}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000; font-size: 11px; letter-spacing: 0.5px;">
            <strong>PAYMENT:</strong> CASH ON DELIVERY
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000; font-size: 11px; letter-spacing: 0.5px; line-height: 1.4; max-width: 300px;">
            ${placedOrderDetails.shippingAddress ? String(placedOrderDetails.shippingAddress).toUpperCase() : ''}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: #ff0000; letter-spacing: 1px;">STATUS: UNPAID / DUE</strong>
          </td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 12px; border-bottom: 1.5px solid #000; font-size: 11px; letter-spacing: 1px; color: #000;">DESCRIPTION</th>
            <th style="text-align: right; padding-bottom: 12px; border-bottom: 1.5px solid #000; font-size: 11px; letter-spacing: 1px; color: #000;">TOTAL</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <table class="summary-table">
        <tr><td style="color: #000;">SUBTOTAL</td><td style="text-align: right; font-family: monospace; color: #000;">৳${placedOrderDetails.subtotal}</td></tr>
        <tr><td style="color: #000;">SHIPPING</td><td style="text-align: right; font-family: monospace; color: #000;">৳${placedOrderDetails.deliveryCharge}</td></tr>
        <tr><td style="color: #000;">VAT</td><td style="text-align: right; font-family: monospace; color: #000;">৳${placedOrderDetails.vatAmount}</td></tr>
        <tr style="font-weight: bold; font-size: 13px; color: #ff0000;">
          <td style="padding-top: 12px; border-top: 1px solid #000; letter-spacing: 1px;">AMOUNT DUE</td>
          <td style="text-align: right; padding-top: 12px; border-top: 1px solid #000; font-family: monospace;">৳${placedOrderDetails.grandTotal}</td>
        </tr>
      </table>

      <div class="disclaimer">
        <strong>LEGAL NOTICE:</strong> This is a computer-generated order memorandum for Cash on Delivery (COD) transactions.
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
};

export const handlePrintInvoice = (
  order: Order,
  showToast: (message: string, type: 'success' | 'error') => void
) => {
  const printWindow = window.open('', '_blank', 'width=850,height=900,left=150,top=50');
  if (!printWindow) {
    showToast("Please allow pop-ups in your browser to print the invoice.", 'error');
    return;
  }

  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharge = order.delivery_charge || 0;
  const vat = order.vat_amount || 0;

  const dateObj = new Date(order.created_at);
  const dateStr = dateObj.toLocaleDateString('en-CA');
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const paymentMethodText = order.payment_status?.toUpperCase() || "CASH ON DELIVERY";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice #${order.id.slice(0, 8)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; color: #000; padding: 30px; max-width: 800px; width: 100%; margin: 0 auto; font-size: 11px; line-height: 1.5; background-color: #fff; box-sizing: border-box; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 20px; letter-spacing: 6px; margin: 0 0 5px 0; font-weight: 700; }
        .header h2 { font-size: 9px; letter-spacing: 2px; margin: 10px 0 0 0; color: #555; text-transform: uppercase; font-weight: 600;}
        .top-section { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
        .shipping-info { flex: 1; min-width: 220px; }
        .order-info { text-align: right; flex: 1; min-width: 250px; }
        .shipping-info p, .order-info p { margin: 3px 0; word-break: break-word; }
        .bold { font-weight: 700; }
        .small-title { font-size: 10px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
        .text-red { color: #d93025; }
        .table-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
        .item-row { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 15px; }
        .item-details { display: flex; flex-direction: column; flex: 1; }
        .item-meta { color: #555; font-size: 10px; margin-top: 4px; text-transform: uppercase; }
        .totals-section { display: flex; justify-content: flex-end; margin-top: 30px; }
        .totals-table { width: 100%; max-width: 300px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; }
        .totals-border { border-top: 1px solid #000; margin: 10px 0; }
        .grand-total { font-weight: 700; font-size: 12px; }
        .footer { margin-top: 50px; text-align: center; font-size: 9px; color: #333; line-height: 1.5; }
        @media print { @page { margin: 0; } body { width: 100% !important; max-width: 100% !important; padding: 1cm !important; margin: 0 !important; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>N O M A D</h1>
        <h2>PROFORMA INVOICE / ORDER MEMORANDUM</h2>
      </div>
      <div class="top-section">
        <div class="shipping-info">
          <div class="small-title">SHIPPING TO</div>
          <p class="bold" style="text-transform: uppercase;">${order.customer_name || 'GUEST CUSTOMER'}</p>
          <p>${order.customer_phone || ''}</p>
          ${order.customer_email ? `<p>${order.customer_email}</p>` : ''}
          <p style="text-transform: uppercase; white-space: pre-wrap;">${order.shipping_address || ''}</p>
        </div>
        <div class="order-info">
          <p><span class="bold">ORDER ID:</span> #${order.id}</p>
          <p><span class="bold">DATE:</span> ${dateStr} &nbsp;&nbsp; <span class="bold">TIME:</span> ${timeStr}</p>
          <p><span class="bold">PAYMENT:</span> ${paymentMethodText}</p>
          <p class="bold text-red" style="margin-top: 6px;">STATUS: ${order.status.toUpperCase()}</p>
        </div>
      </div>
      <div class="table-header">
        <div>DESCRIPTION</div>
        <div>TOTAL</div>
      </div>
      ${order.items.length > 0 ? order.items.map(item => `
        <div class="item-row">
          <div class="item-details">
            <span class="bold" style="text-transform: uppercase;">${item.product_name}</span>
            <span class="item-meta">SIZE: ${item.size} | COLOR: ${item.color} | QTY: ${item.quantity} x ৳${item.price}</span>
          </div>
          <div style="font-weight: 600; white-space: nowrap;">৳${item.price * item.quantity}</div>
        </div>
      `).join('') : '<div style="margin-bottom: 15px;">No item details available.</div>'}
      <div class="totals-section">
        <div class="totals-table">
          <div class="totals-row">
            <span>SUBTOTAL</span>
            <span>৳${subtotal > 0 ? subtotal : order.total_amount - deliveryCharge - vat}</span>
          </div>
          <div class="totals-row">
            <span>SHIPPING</span>
            <span>৳${deliveryCharge}</span>
          </div>
          ${vat > 0 ? `<div class="totals-row"><span>VAT</span><span>৳${vat}</span></div>` : ''}
          <div class="totals-border"></div>
          <div class="totals-row grand-total text-red">
            <span>AMOUNT DUE</span>
            <span>৳${order.total_amount}</span>
          </div>
        </div>
      </div>
      <div class="footer"><span class="bold">LEGAL NOTICE:</span> This is a computer-generated order memorandum.</div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 200);
          window.onafterprint = function() { window.close(); };
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
};

export const handlePrintBulkInvoices = (
  ordersToPrint: Order[],
  showToast: (message: string, type: 'success' | 'error') => void
) => {
  if (ordersToPrint.length === 0) {
    showToast("No orders available to print.", 'error');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=850,height=900,left=150,top=50');
  if (!printWindow) {
    showToast("Please allow pop-ups in your browser to print invoices.", 'error');
    return;
  }

  const invoicesHtml = ordersToPrint.map(order => {
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharge = order.delivery_charge || 0;
    const vat = order.vat_amount || 0;

    const dateObj = new Date(order.created_at);
    const dateStr = dateObj.toLocaleDateString('en-CA');
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const paymentMethodText = order.payment_status?.toUpperCase() || "CASH ON DELIVERY";

    return `
      <div class="invoice-page">
        <div class="header">
          <h1>N O M A D</h1>
          <h2>PROFORMA INVOICE / ORDER MEMORANDUM</h2>
        </div>

        <div class="top-section">
          <div class="shipping-info">
            <div class="small-title">SHIPPING TO</div>
            <p class="bold" style="text-transform: uppercase;">${order.customer_name || 'GUEST CUSTOMER'}</p>
            <p>${order.customer_phone || ''}</p>
            ${order.customer_email ? `<p>${order.customer_email}</p>` : ''}
            <p style="text-transform: uppercase; white-space: pre-wrap;">${order.shipping_address || ''}</p>
          </div>
          <div class="order-info">
            <p><span class="bold">ORDER ID:</span> #${order.id}</p>
            <p><span class="bold">DATE:</span> ${dateStr} &nbsp;&nbsp; <span class="bold">TIME:</span> ${timeStr}</p>
            <p><span class="bold">PAYMENT:</span> ${paymentMethodText}</p>
            <p class="bold text-red" style="margin-top: 6px;">STATUS: ${order.status.toUpperCase()}</p>
          </div>
        </div>

        <div class="table-header">
          <div>DESCRIPTION</div>
          <div>TOTAL</div>
        </div>

        ${order.items.length > 0 ? order.items.map(item => `
          <div class="item-row">
            <div class="item-details">
              <span class="bold" style="text-transform: uppercase;">${item.product_name}</span>
              <span class="item-meta">SIZE: ${item.size} | COLOR: ${item.color} | QTY: ${item.quantity} x ৳${item.price}</span>
            </div>
            <div style="font-weight: 600; white-space: nowrap;">৳${item.price * item.quantity}</div>
          </div>
        `).join('') : '<div style="margin-bottom: 15px;">No item details available.</div>'}

        <div class="totals-section">
          <div class="totals-table">
            <div class="totals-row">
              <span>SUBTOTAL</span>
              <span>৳${subtotal > 0 ? subtotal : order.total_amount - deliveryCharge - vat}</span>
            </div>
            <div class="totals-row">
              <span>SHIPPING</span>
              <span>৳${deliveryCharge}</span>
            </div>
            ${vat > 0 ? `<div class="totals-row"><span>VAT</span><span>৳${vat}</span></div>` : ''}
            <div class="totals-border"></div>
            <div class="totals-row grand-total text-red">
              <span>AMOUNT DUE</span>
              <span>৳${order.total_amount}</span>
            </div>
          </div>
        </div>

        <div class="footer"><span class="bold">LEGAL NOTICE:</span> This is a computer-generated order memorandum.</div>
      </div>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bulk Invoices (${ordersToPrint.length})</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; color: #000; margin: 0; padding: 0; font-size: 11px; line-height: 1.5; background-color: #fff; }
        .invoice-page { padding: 30px; max-width: 800px; width: 100%; margin: 0 auto; box-sizing: border-box; page-break-after: always; break-after: page; page-break-inside: avoid; }
        .invoice-page:last-child { page-break-after: auto; break-after: auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 20px; letter-spacing: 6px; margin: 0 0 5px 0; font-weight: 700; }
        .header h2 { font-size: 9px; letter-spacing: 2px; margin: 10px 0 0 0; color: #555; text-transform: uppercase; font-weight: 600;}
        .top-section { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
        .shipping-info { flex: 1; min-width: 220px; }
        .order-info { text-align: right; flex: 1; min-width: 250px; }
        .shipping-info p, .order-info p { margin: 3px 0; word-break: break-word; }
        .bold { font-weight: 700; }
        .small-title { font-size: 10px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
        .text-red { color: #d93025; }
        .table-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
        .item-row { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 15px; }
        .item-details { display: flex; flex-direction: column; flex: 1; }
        .item-meta { color: #555; font-size: 10px; margin-top: 4px; text-transform: uppercase; }
        .totals-section { display: flex; justify-content: flex-end; margin-top: 30px; }
        .totals-table { width: 100%; max-width: 300px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; }
        .totals-border { border-top: 1px solid #000; margin: 10px 0; }
        .grand-total { font-weight: 700; font-size: 12px; }
        .footer { margin-top: 50px; text-align: center; font-size: 9px; color: #333; line-height: 1.5; }
        @media print { @page { margin: 0; } body { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; } .invoice-page { padding: 1cm !important; } }
      </style>
    </head>
    <body>
      ${invoicesHtml}
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 200);
          window.onafterprint = function() { window.close(); };
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
};
