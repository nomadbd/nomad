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
