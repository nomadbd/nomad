import { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: `নতুন অর্ডার - ${formData.get('productName')}`,
    html: `
      <h2>নতুন অর্ডার পেয়েছেন</h2>
      <p><strong>প্রোডাক্ট আইডি:</strong> ${formData.get('productId')}</p>
      <p><strong>নাম:</strong> ${formData.get('name')}</p>
      <p><strong>ফোন:</strong> ${formData.get('phone')}</p>
      <p><strong>ঠিকানা:</strong> ${formData.get('address')}</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  return Response.json({ success: true });
}