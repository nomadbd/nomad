import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // এখন 'cartItems' একটি অ্যারে হিসেবে আসবে
    const { 
      cartItems, name, phone, address, method, sender_no, txn_id, total, ref 
    } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // কার্টের প্রোডাক্টগুলো ইমেইলের জন্য লুপ করে সাজানো
    const productListHtml = cartItems.map(item => `
      <div style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        <p style="margin: 0;"><strong>${item.name}</strong></p>
        <p style="margin: 0; font-size: 12px; color: #555;">Size: ${item.size} | Color: ${item.color} | Price: ৳${item.base}</p>
      </div>
    `).join('');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, 
      subject: `NEW CART ORDER: ৳${total}`,
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
            <h3 style="margin-top: 0; font-size: 14px; text-decoration: underline;">ORDER ITEMS</h3>
            ${productListHtml}
            <p style="margin-top: 10px; font-size: 18px; font-weight: bold;">TOTAL: ৳${total}</p>
            <p style="margin: 5px 0; color: #777; font-size: 12px;"><strong>FB REF CODE:</strong> ${ref || 'Direct Site Visit'}</p>
          </div>

          <br/>
          <div style="background-color: #f0f0f0; padding: 15px; border-left: 4px solid #000;">
            <p style="margin: 0;"><strong>PAYMENT METHOD:</strong> ${method}</p>
            <p style="margin: 5px 0;"><strong>SENDER NUMBER:</strong> ${sender_no}</p>
            <p style="margin: 0;"><strong>TRANSACTION ID:</strong> ${txn_id}</p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).send(`
        <html>
          <head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script></head>
          <body class="bg-black text-white flex h-screen items-center justify-center p-6 text-center font-sans">
            <div>
              <h1 class="text-3xl font-black mb-4">ORDER SUCCESSFUL!</h1>
              <p class="text-zinc-400">We have received your cart order.</p>
              <a href="/" class="block mt-6 bg-white text-black px-10 py-4 rounded-full font-bold">BACK TO STORE</a>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error(error);
      res.status(500).send('<h1>Error occurred.</h1>');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
