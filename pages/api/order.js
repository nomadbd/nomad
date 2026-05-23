import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { product, name, phone, address, bkashNumber, txid } = req.body;

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
      subject: `🚨 NEW ORDER: ${product}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #fafafa; border: 1px solid #eee;">
          <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">NOMAD - নতুন অর্ডার!</h2>
          <p><strong>পণ্য:</strong> <span style="font-size: 16px; color: #111;">${product}</span></p>
          <p><strong>কাস্টমারের নাম:</strong> ${name}</p>
          <p><strong>মোবাইল নম্বর:</strong> ${phone}</p>
          <p><strong>ঠিকানা:</strong> ${address}</p>
          <br/>
          <div style="background-color: #fff5f5; padding: 15px; border-left: 4px solid #e53e3e;">
            <p style="margin: 0;"><strong>বিকাশ নম্বর:</strong> ${bkashNumber}</p>
            <p style="margin: 5px 0 0 0;"><strong>Transaction ID (TxID):</strong> <span style="font-family: monospace; font-weight: bold; color: #c53030;">${txid}</span></p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).send(`
        <html>
          <head><meta charset="UTF-8"><title>Success</title><script src="https://cdn.tailwindcss.com"></script></head>
          <body class="bg-black text-white flex h-screen items-center justify-center p-6 text-center font-sans">
            <div class="space-y-4">
              <h1 class="text-3xl font-black text-red-500">অর্ডার সফল হয়েছে!</h1>
              <p class="text-zinc-400 text-sm max-w-sm">আপনার পেমেন্ট ভেরিফাই করে আমরা দ্রুতই আপনার সাথে যোগাযোগ করব। ধন্যবাদ!</p>
              <a href="/" class="inline-block mt-4 text-xs bg-zinc-900 border border-zinc-800 px-6 py-2 rounded-full hover:bg-white hover:text-black transition">হোমপেজে ফিরুন</a>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send('<h1>Error occurred. Please try again.</h1>');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
