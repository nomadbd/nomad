import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, address, transactionId, title, id, total, paymentMethod } = body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'nomadbysh@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: '"Nomad Order" <nomadbysh@gmail.com>',
      to: 'nomadbysh@gmail.com',
      subject: `New Order: ${title}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>New Order Received</h2>
          <p><b>Product:</b> ${title}</p>
          <p><b>Total Amount:</b> ${total} BDT</p>
          <hr/>
          <p><b>Customer:</b> ${name}</p>
          <p><b>Phone:</b> ${phone}</p>
          <p><b>Address:</b> ${address}</p>
          <p><b>Payment:</b> ${paymentMethod}</p>
          <p><b>Transaction ID:</b> ${transactionId}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
