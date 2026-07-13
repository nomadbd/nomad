export interface InvoiceItem {
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

export interface InvoiceData {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items: InvoiceItem[];
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: string;
  delivery_charge?: number;
  vat_amount?: number;
}

export const printInvoice = (order: InvoiceData) => {
  const dateObj = new Date(order.created_at);
  const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  const formattedTime = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

  const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryCharge = order.delivery_charge || 0;
  const vatAmount = order.vat_amount || 0;
  const grandTotal = order.total_amount;

  const currentStatus = (order.status || 'pending').toUpperCase();
  const isDelivered = currentStatus === 'DELIVERED';
  const statusColor = isDelivered ? '#000000' : '#ff0000';
  const totalLabel = isDelivered ? 'TOTAL PAID' : 'AMOUNT DUE';

  const itemsHtml = order.items.map((item) => {
    const detailsArray = [];
    if (item.size && item.size !== 'N/A') detailsArray.push(`SIZE: ${item.size.toUpperCase()}`);
    if (item.color && item.color !== 'N/A') detailsArray.push(`COLOR: ${item.color.toUpperCase()}`);
    detailsArray.push(`QTY: ${item.quantity}`);

    return `
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; letter-spacing: 1px; line-height: 1.6; color: #000 !important;">
          <strong style="color: #000 !important; display: block; margin-bottom: 4px;">${item.product_name.toUpperCase()}</strong>
          <div style="color: #555; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase;">
            ${detailsArray.join(' &nbsp;|&nbsp; ')} &nbsp;•&nbsp; ৳${item.price}
          </div>
        </td>
        <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; text-align: right; font-family: monospace; vertical-align: bottom; color: #000 !important;">৳${item.price * item.quantity}</td>
      </tr>
    `;
  }).join('');

  const printContainer = document.createElement('div');
  printContainer.id = 'nomad-universal-print-area';

  printContainer.innerHTML = `
    <div class="header">NOMAD</div>
    <div class="sub-header">Proforma Invoice / Live Order Memorandum</div>
    
    <table class="info-table">
      <tr>
        <td style="width: 50%; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px;">
          <span style="color: #666; font-size: 9px; letter-spacing: 1.5px; font-weight: bold; display: block;">SHIPPING TO</span>
        </td>
        <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
          <strong style="color: #000 !important;">ORDER ID:</strong> #${order.id}
        </td>
      </tr>
      <tr>
        <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">
          ${(order.customer_name || 'VALUED CUSTOMER').toUpperCase()}
        </td>
        <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
          <strong style="color: #000 !important;">DATE:</strong> ${formattedDate} &nbsp;&nbsp; <strong style="color: #000 !important;">TIME:</strong> ${formattedTime}
        </td>
      </tr>
      <tr>
        <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
          ${order.customer_phone || 'N/A'}
        </td>
        <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
          <strong style="color: #000 !important;">PAYMENT:</strong> CASH ON DELIVERY
        </td>
      </tr>
      <tr>
        <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px; line-height: 1.4; max-width: 300px;">
          ${(order.shipping_address || 'N/A').toUpperCase()}
        </td>
        <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
          <strong style="color: ${statusColor}; letter-spacing: 1px; text-transform: uppercase;">STATUS: ${currentStatus}</strong>
        </td>
      </tr>
    </table>

    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: left; padding-bottom: 12px; border-bottom: 1.5px solid #000; font-size: 11px; letter-spacing: 1px; color: #000 !important;">DESCRIPTION</th>
          <th style="text-align: right; padding-bottom: 12px; border-bottom: 1.5px solid #000; font-size: 11px; letter-spacing: 1px; color: #000 !important;">TOTAL</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <table class="summary-table">
      <tr><td style="color: #000 !important;">SUBTOTAL</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${subtotal}</td></tr>
      <tr><td style="color: #000 !important;">SHIPPING</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${deliveryCharge}</td></tr>
      <tr><td style="color: #000 !important;">VAT</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${vatAmount}</td></tr>
      <tr style="font-weight: bold; font-size: 13px; color: ${statusColor};">
        <td style="padding-top: 12px; border-top: 1px solid #000; letter-spacing: 1px;">${totalLabel}</td>
        <td style="text-align: right; padding-top: 12px; border-top: 1px solid #000; font-family: monospace;">৳${grandTotal}</td>
      </tr>
    </table>

    <div class="disclaimer">
      <strong>LEGAL NOTICE:</strong> This is a live computer-generated order memorandum for Cash on Delivery (COD) transactions reflecting real-time fulfillment updates. Physical products remain property of NOMAD until the full invoice amount is successfully collected by our authorized delivery agent.
    </div>
  `;

  const styleSheet = document.createElement('style');
  styleSheet.innerHTML = `
    @media print {
      @page { margin: 0mm; }
      body { 
        background: #fff !important; 
        color: #000 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      body > *:not(#nomad-universal-print-area) {
        display: none !important;
      }
      #nomad-universal-print-area {
        display: block !important;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: #fff !important;
        color: #000 !important;
        padding: 50px 40px !important;
        box-sizing: border-box;
        font-family: sans-serif;
      }
      .header { text-align: center; margin-bottom: 10px; letter-spacing: 6px; font-weight: bold; font-size: 22px; color: #000 !important; }
      .sub-header { text-align: center; font-size: 10px; letter-spacing: 3px; color: #666 !important; margin-bottom: 50px; text-transform: uppercase; }
      .info-table { width: 100%; margin-bottom: 40px; font-size: 11px; letter-spacing: 0.5px; border-collapse: collapse; }
      .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
      .summary-table { width: 40%; margin-left: auto; font-size: 11px; line-height: 2; letter-spacing: 0.5px; margin-bottom: 60px; page-break-inside: avoid !important; }
      .disclaimer { font-size: 9px; color: #777 !important; line-height: 1.6; text-align: center; border-top: 1px solid #eee; padding-top: 20px; letter-spacing: 0.5px; page-break-inside: avoid; }
    }
    @media screen {
      #nomad-universal-print-area { display: none !important; }
    }
  `;

  document.body.appendChild(printContainer);
  document.head.appendChild(styleSheet);

  setTimeout(() => {
    window.print();
    if (document.getElementById('nomad-universal-print-area')) {
      document.body.removeChild(printContainer);
    }
    document.head.removeChild(styleSheet);
  }, 150);
};
