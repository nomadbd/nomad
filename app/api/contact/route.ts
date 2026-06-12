import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, phone, address, transactionId, productTitle } = await req.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'nomadbysh@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD, // ভারসেল এনভায়রনমেন্টে এটি সেট করবেন
      },
    });

    await transporter.sendMail({
      from: '"Nomad Order" <nomadbysh@gmail.com>',
      to: 'nomadbysh@gmail.com',
      subject: `New Order: ${productTitle}`,
      html: `
        <h2>New Order Details</h2>
        <p><b>Product:</b> ${productTitle}</p>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Address:</b> ${address}</p>
        <p><b>Transaction ID:</b> ${transactionId}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
