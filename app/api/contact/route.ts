// app/api/contact/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const body = await req.json();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'nomadbysh@gmail.com', pass: process.env.EMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from: 'nomadbysh@gmail.com',
    to: 'nomadbysh@gmail.com',
    subject: 'New Order Request',
    text: JSON.stringify(body),
  });

  return NextResponse.json({ success: true });
}
