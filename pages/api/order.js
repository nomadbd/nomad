import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { product, size, color, name, phone, address, payment_no, txn_id } = req.body;

    // ইমেইল পাঠানোর কনফিগারেশন
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'nomadbysh@gmail.com',
        pass: 'your-app-password', // আপনার জিমেইল অ্যাপ পাসওয়ার্ড এখানে দিন
      },
    });

    const mailOptions = {
      from: 'nomadbysh@gmail.com',
      to: 'nomadbysh@gmail.com',
      subject: `NEW ORDER: ${product}`,
      text: `
        NEW ORDER RECEIVED
        ------------------
        Product: ${product}
        Size: ${size}
        Color: ${color}
        
        CUSTOMER DETAILS
        ----------------
        Name: ${name}
        Phone: ${phone}
        Address: ${address}
        
        PAYMENT INFORMATION
        -------------------
        Sender Number: ${payment_no}
        Transaction ID: ${txn_id}
      `,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; max-width: 600px;">
          <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">NEW ORDER</h2>
          <p><strong>Product:</strong> ${product}</p>
          <p><strong>Size:</strong> ${size}</p>
          <p><strong>Color:</strong> ${color}</p>
          <hr />
          <h3>Customer Details</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Address:</strong> ${address}</p>
          <hr />
          <div style="background: #f9f9f9; padding: 15px; border-radius: 10px;">
            <h3 style="margin-top: 0;">Payment Info</h3>
            <p><strong>Sender No:</strong> ${payment_no}</p>
            <p><strong>TxID:</strong> ${txn_id}</p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).send('Order Placed Successfully');
    } catch (error) {
      res.status(500).send('Error sending email');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
