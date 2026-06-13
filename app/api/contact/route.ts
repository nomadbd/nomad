import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Nodemailer ট্রান্সপোর্টার কনফিগারেশন
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'nomadbysh@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD, // আপনার এনভায়রনমেন্ট ভেরিয়েবল সেট করা থাকতে হবে
      },
    });

    // ইমেইল পাঠানোর লজিক
    await transporter.sendMail({
      from: '"Nomad Order" <nomadbysh@gmail.com>',
      to: 'nomadbysh@gmail.com',
      subject: `New Order: ${data.title || 'Product Order'}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #000;">নতুন অর্ডার রিসিভ হয়েছে</h2>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
            <p><b>Product:</b> ${data.title}</p>
            <p><b>Price:</b> ${data.price} BDT</p>
            <p><b>Product ID:</b> ${data.id}</p>
          </div>
          <h3 style="margin-top: 20px;">গ্রাহকের তথ্য:</h3>
          <p><b>নাম:</b> ${data.name}</p>
          <p><b>ফোন:</b> ${data.phone}</p>
          <p><b>ঠিকানা:</b> ${data.address}</p>
          <p><b>সাইজ:</b> ${data.size}</p>
          <p><b>কালার:</b> ${data.color}</p>
          <hr/>
          <h3 style="margin-top: 20px;">পেমেন্ট তথ্য:</h3>
          <p><b>মেথড:</b> ${data.paymentMethod}</p>
          <p><b>ট্রানজেকশন আইডি:</b> ${data.transactionId}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}
