import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, address, transactionId, productTitle, productId, price, size, color } = body;

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
      subject: `New Order: ${productTitle} (ID: ${productId})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
          <h2 style="color: #000;">New Order Received</h2>
          <p><b>Product:</b> ${productTitle}</p>
          <p><b>Product ID:</b> ${productId}</p>
          <p><b>Price:</b> ${price} BDT</p>
          <hr/>
          <h3>Customer Details:</h3>
          <p><b>Name:</b> ${name}</p>
          <p><b>Phone:</b> ${phone}</p>
          <p><b>Size/Color:</b> ${size} / ${color}</p>
          <p><b>Address:</b> ${address}</p>
          <hr/>
          <p><b>Transaction ID:</b> <span style="background: #f4f4f4; padding: 5px;">${transactionId}</span></p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
