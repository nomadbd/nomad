import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { product_name, product_price, fb_ref, name, phone, address, size, color, txn_id } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Order: ${product_name}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>NOMAD ORDER DETAILS</h2>
          <p><strong>CUSTOMER ADDRESS:</strong> ${address}</p>
          <hr/>
          <h3>PRODUCT DETAILS:</h3>
          <p><strong>NAME:</strong> ${product_name}</p>
          <p><strong>PRICE:</strong> ${product_price} BDT</p>
          <p><strong>SIZE:</strong> ${size} | <strong>COLOR:</strong> ${color}</p>
          <p><strong>FB REF CODE:</strong> ${fb_ref || 'Direct Site Visit'}</p>
          <hr/>
          <h3>CUSTOMER INFO:</h3>
          <p><strong>NAME:</strong> ${name}</p>
          <p><strong>PHONE:</strong> ${phone}</p>
          <p><strong>TXN ID:</strong> ${txn_id}</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).send('<h1>Order Successful!</h1><a href="/">Go Back</a>');
    } catch (e) { res.status(500).send('Error'); }
  }
}
