import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { product_name, final_price, fb_ref, name, phone, address, size, color, txn_id } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `NEW ORDER: ${product_name} - ৳${final_price}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; color: #333; border: 1px solid #eee; padding: 30px; border-radius: 10px;">
          <h2 style="color: #000; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">NOMAD BY SH</h2>
          
          <div style="background: #fdfdfd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #000;">
            <h4 style="margin: 0 0 10px 0; color: #000;">CUSTOMER SHIPPING INFO</h4>
            <p style="margin: 3px 0;"><strong>NAME:</strong> ${name}</p>
            <p style="margin: 3px 0;"><strong>PHONE:</strong> ${phone}</p>
            <p style="margin: 3px 0;"><strong>ADDRESS:</strong> ${address}</p>
          </div>

          <div style="padding: 20px; border: 1px dashed #ddd; border-radius: 10px;">
            <h4 style="margin: 0 0 10px 0; color: #000;">PRODUCT DETAILS</h4>
            <table style="width: 100%; font-size: 14px;">
              <tr><td><strong>PRODUCT:</strong></td><td>${product_name}</td></tr>
              <tr><td><strong>FINAL PRICE:</strong></td><td>৳${final_price}</td></tr>
              <tr><td><strong>SIZE/COLOR:</strong></td><td>${size} / ${color}</td></tr>
              <tr><td><strong>REF CODE:</strong></td><td>${fb_ref || 'Direct Site Visit'}</td></tr>
            </table>
          </div>

          <div style="margin-top: 25px; text-align: center; background: #000; color: #fff; padding: 15px; border-radius: 10px;">
             <p style="margin: 0;"><strong>TRANSACTION ID:</strong> ${txn_id}</p>
          </div>
          
          <p style="font-size: 10px; color: #aaa; margin-top: 20px; text-align: center;">This is an automated order notification from NOMAD STORE.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).send(`
        <html>
          <body style="background: #000; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center;">
            <div>
              <h1 style="font-size: 40px;">✔</h1>
              <h2>ORDER SUCCESSFUL</h2>
              <p style="color: #666;">We have received your order. We'll contact you shortly.</p>
              <a href="/" style="color: #fff; border: 1px solid #fff; padding: 10px 30px; text-decoration: none; border-radius: 50px; display: inline-block; margin-top: 20px;">BACK TO STORE</a>
            </div>
          </body>
        </html>
      `);
    } catch (e) {
      console.error(e);
      res.status(500).send('Error sending order. Please contact support.');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
