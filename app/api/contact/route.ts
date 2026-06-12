import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      name, phone, address, transactionId, productTitle, 
      productId, price, size, color, paymentMethod, category 
    } = body;

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
      subject: `New Order: ${productTitle} | ID: ${productId}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #000;">New Order Received</h2>
          <p><b>Product:</b> ${productTitle}</p>
          <p><b>ID:</b> ${productId}</p>
          <p><b>Category:</b> ${category || 'N/A'}</p>
          <p><b>Price:</b> ${price} BDT</p>
          <hr/>
          <p><b>Customer:</b> ${name}</p>
          <p><b>Phone:</b> ${phone}</p>
          <p><b>Size/Color:</b> ${size} / ${color}</p>
          <p><b>Delivery Address:</b> ${address}</p>
          <hr/>
          <p><b>Payment:</b> ${paymentMethod}</p>
          <p><b>Transaction ID:</b> <b>${transactionId}</b></p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
