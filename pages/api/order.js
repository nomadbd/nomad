import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { product_id, product_name, price, delivery, total, ref, size, color, name, phone, address, method, sender_no, txn_id } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, 
      subject: `NEW ORDER: ${product_name} (#${product_id}) - ৳${total}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #fafafa; border: 1px solid #eee; color: #333; max-width: 600px; margin: auto;">
          <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px; text-align: center;">NOMAD - NEW ORDER RECEIVED</h2>
          
          <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; font-size: 14px; text-decoration: underline;">CUSTOMER SHIPPING INFO</h3>
            <p style="margin: 5px 0;"><strong>NAME:</strong> ${name}</p>
            <p style="margin: 5px 0;"><strong>PHONE:</strong> ${phone}</p>
            <p style="margin: 5px 0;"><strong>ADDRESS:</strong> ${address}</p>
          </div>

          <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 10px;">
            <h3 style="margin-top: 0; font-size: 14px; text-decoration: underline;">PRODUCT DETAILS</h3>
            <p style="margin: 5px 0;"><strong>PRODUCT:</strong> ${product_name} (#${product_id})</p>
            <p style="margin: 5px 0;"><strong>BASE PRICE:</strong> ৳${price}</p>
            <p style="margin: 5px 0;"><strong>DELIVERY CHARGE:</strong> ${parseInt(delivery) === 0 ? 'FREE' : '৳'+delivery}</p>
            <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #d00;">TOTAL PAYABLE: ৳${total}</p>
            <p style="margin: 5px 0;"><strong>SIZE:</strong> ${size} | <strong>COLOR:</strong> ${color}</p>
            <p style="margin: 5px 0; color: #777; font-size: 12px;"><strong>FB REF CODE:</strong> ${ref || 'Direct Site Visit'}</p>
          </div>

          <br/>
          <div style="background-color: #f0f0f0; padding: 15px; border-left: 4px solid #000;">
            <p style="margin: 0;"><strong>PAYMENT METHOD:</strong> ${method}</p>
            <p style="margin: 5px 0;"><strong>SENDER NUMBER:</strong> ${sender_no}</p>
            <p style="margin: 0;"><strong>TRANSACTION ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #000;">${txn_id}</span></p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).send(`
        <html>
          <head><meta charset="UTF-8"><title>Order Successful</title><script src="https://cdn.tailwindcss.com"></script></head>
          <body class="bg-black text-white flex h-screen items-center justify-center p-6 text-center font-sans">
            <div class="space-y-4">
              <div class="text-5xl mb-4">✔</div>
              <h1 class="text-3xl font-black text-white uppercase tracking-tighter">ORDER SUCCESSFUL!</h1>
              <p class="text-zinc-400 text-sm max-w-sm mx-auto uppercase tracking-widest" style="font-size: 10px;">We have received your order for <strong>${product_name}</strong>. Our team will contact you shortly.</p>
              <a href="/" class="inline-block mt-6 text-xs bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-zinc-200 transition tracking-widest">BACK TO STORE</a>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error(error);
      res.status(500).send('<h1>Error occurred while sending email.</h1>');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
