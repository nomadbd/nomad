export interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: string;
  delivery_charge?: number;
  vat_amount?: number;
  payment_status?: string;
  courier_name?: string;
  tracking_id?: string;
  admin_notes?: string;
  customer_notes?: string;
  return_reason?: string;
  items: Array<{
    product_name: string;
    product_image: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }>;
}

export const TEMPLATE_PRESETS: { [key: string]: string } = {
  ALL: "Hello {{name}},\n\nThank you for choosing NOMAD. Your order status is: {{status}}.\n\nOrder ID: #{{order_id}}\nCourier: {{courier}}\nTracking ID: {{tracking}}\n\nThank you for shopping with us!",
  Pending: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) is currently PENDING. We are processing it soon!\n\nThank you for shopping with NOMAD.",
  Received: "Hello {{name}},\n\nWe have received your NOMAD order (#{{order_id}}). We are preparing it for processing.\n\nThank you for shopping with NOMAD.",
  Processing: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) is now being PROCESSED.\n\nThank you for shopping with NOMAD.",
  Shipped: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) has been SHIPPED!\n\nCourier: {{courier}}\nTracking ID: {{tracking}}\n\nThank you for shopping with NOMAD!",
  Delivered: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) has been DELIVERED successfully!\n\nCourier: {{courier}}\nTracking ID: {{tracking}}\n\nThank you for shopping with NOMAD!",
  Cancelled: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) status is CANCELLED. Please contact us for further details."
};

export const formatWhatsAppNumber = (phone: string): string => {
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return '88' + digits;
  if (digits.length === 10) return '880' + digits;
  return digits;
};

export const renderPersonalizedText = (template: string, order: Order): string => {
  let text = template
    .replace(/{{name}}/g, order.customer_name || 'Customer')
    .replace(/{{status}}/g, (order.status || 'Updated').toUpperCase())
    .replace(/{{order_id}}/g, order.id.slice(0, 8))
    .replace(/{{courier}}/g, order.courier_name || 'N/A')
    .replace(/{{tracking}}/g, order.tracking_id || 'N/A');

  if (order.customer_notes && order.customer_notes.trim() !== '') {
    text += `\n\nNote:\n${order.customer_notes.trim()}`;
  }

  return text;
};
