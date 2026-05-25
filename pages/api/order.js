import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // index.js থেকে পাঠানো নতুন ডাটাগুলো রিসিভ করা হচ্ছে
    const { product, size, color, name, phone, address, payment_no, txn_id } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // ভারসেলে সেট করা আপনার ইমেইল
        pass: process.env.EMAIL_PASS, // ভারসেলে সেট করা আপনার অ্যাপ পাসওয়ার্ড
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, 
      subject: ` NEW ORDER: ${product}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #fafafa; border: 1px solid #eee; color: #333;">
          <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">NOMAD - NEW ORDER RECEIVED</h2>
          <p><strong>PRODUCT:</strong> <span style="font-size: 16px; color: #111;">${product}</span></p>
          <p><strong>SIZE:</strong> ${size}</p>
          <p><strong>COLOR:</strong> ${color}</p>
          <hr/>
          <p><strong>CUSTOMER NAME:</strong> ${name}</p>
          <p><strong>PHONE:</strong> ${phone}</p>
          <p><strong>ADDRESS:</strong> ${address}</p>
          <br/>
          <div style="background-color: #f0f0f0; padding: 15px; border-left: 4px solid #000;">
            <p style="margin: 0;"><strong>SENDER NUMBER:</strong> ${payment_no}</p>
            <p style="margin: 5px 0 0 0;"><strong>TRANSACTION ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #000;">${txn_id}</span></p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      // অর্ডার সফল হওয়ার পর সুন্দর সাকসেস মেসেজ (সম্পূর্ণ ইংরেজি)
      res.status(200).send(`
        <html>
          <head><meta charset="UTF-8"><title>Order Successful</title><script src="https://cdn.tailwindcss.com"></script></head>
          <body class="bg-black text-white flex h-screen items-center justify-center p-6 text-center font-sans">
            <div class="space-y-4">
              <h1 class="text-3xl font-black text-white">ORDER SUCCESSFUL!</h1>
              <p class="text-zinc-400 text-sm max-w-sm">We have received your order. Our team will verify the payment and contact you shortly. Thank you for choosing NOMAD.</p>
              <a href="/" class="inline-block mt-4 text-xs bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition">BACK TO STORE</a>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error(error);
      res.status(500).send('<h1>Error occurred while sending email. Please check Vercel Env Variables.</h1>');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
