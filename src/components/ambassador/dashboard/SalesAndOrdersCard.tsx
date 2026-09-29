import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

interface SalesAndOrdersCardProps {
  ambassadorId: string;
}

export default function SalesAndOrdersCard({ ambassadorId }: SalesAndOrdersCardProps) {
  const [loading, setLoading] = useState<boolean>(true);

  // Stats States (প্রাথমিক ডেমো ভ্যালু সহ)
  const [successfulOrders, setSuccessfulOrders] = useState<number>(48);
  const [cancelledOrders, setCancelledOrders] = useState<number>(3);
  const [processingOrders, setProcessingOrders] = useState<number>(5);
  const [totalItemsSold, setTotalItemsSold] = useState<number>(62);

  const totalOrders = successfulOrders + cancelledOrders + processingOrders;

  useEffect(() => {
    async function fetchOrderMetrics() {
      if (!ambassadorId) return;

      try {
        setLoading(true);

        /* 
          ------------------------------------------------------------------
          Supabase Integration Logic:
          আপনার DB টেবিলে 'orders' বা আপনার নির্দিষ্ট টেবিল নাম অনুযায়ী 
          নিচের কুয়েরিটি অ্যাডজাস্ট করে নিতে পারেন।
          ------------------------------------------------------------------
        */
        const { data: orders, error } = await supabase
          .from('orders') // আপনার অরিজিনাল টেবিল নাম
          .select('status, total_quantity')
          .eq('ambassador_id', ambassadorId);

        if (error) throw error;

        if (orders && orders.length > 0) {
          let successCount = 0;
          let cancelCount = 0;
          let processCount = 0;
          let itemsCount = 0;

          orders.forEach((order) => {
            const status = order.status?.toUpperCase();
            if (status === 'DELIVERED' || status === 'PAID' || status === 'SUCCESS') {
              successCount++;
              itemsCount += order.total_quantity || 1;
            } else if (status === 'CANCELLED' || status === 'REJECTED') {
              cancelCount++;
            } else {
              processCount++;
            }
          });

          setSuccessfulOrders(successCount);
          setCancelledOrders(cancelCount);
          setProcessingOrders(processCount);
          setTotalItemsSold(itemsCount);
        }
      } catch (err: any) {
        console.warn('Orders fetch error (Using demo data as fallback):', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderMetrics();
  }, [ambassadorId]);

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#050505',
        border: '1px solid #1a1a1a',
        borderRadius: '16px',
        padding: '16px',
        color: '#ffffff',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* ১. হেডার (SALES & ORDERS বামে, TOTAL ডানে - Absolute Positioning) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '18px',
          marginBottom: '14px',
          boxSizing: 'border-box'
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            fontSize: '11px',
            fontWeight: '700',
            color: '#888888',
            letterSpacing: '1.5px',
            textTransform: 'uppercase'
          }}
        >
          SALES & ORDERS
        </span>

        <span
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            color: '#888888',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.5px',
            textTransform: 'uppercase'
          }}
        >
          {totalOrders} TOTAL &rsaquo;
        </span>
      </div>

      {/* ২. প্রথম সারি: SUCCESSFUL & CANCELLED (প্রাইমারি সেলস স্ট্যাটস) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '10px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* সফল বিক্রি (SUCCESSFUL) */}
        <div
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #1a1a1a',
            padding: '12px 14px',
            borderRadius: '12px'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#888888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '500'
            }}
          >
            SUCCESSFUL
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#34d399',
              marginTop: '4px'
            }}
          >
            {successfulOrders} <span style={{ fontSize: '10px', color: '#666666', fontWeight: '500' }}>ORDERS</span>
          </div>
        </div>

        {/* ক্যানসেলড (CANCELLED) */}
        <div
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #1a1a1a',
            padding: '12px 14px',
            borderRadius: '12px'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#888888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '500'
            }}
          >
            CANCELLED
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#f87171',
              marginTop: '4px'
            }}
          >
            {cancelledOrders} <span style={{ fontSize: '10px', color: '#666666', fontWeight: '500' }}>ORDERS</span>
          </div>
        </div>
      </div>

      {/* ৩. দ্বিতীয় সারি: PROCESSING & ITEMS SOLD (সেকেন্ডারি স্ট্যাটস) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* প্রসেসিং/চলমান (PROCESSING) */}
        <div
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #1a1a1a',
            padding: '12px 14px',
            borderRadius: '12px'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#888888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '500'
            }}
          >
            PROCESSING
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 'bold',
              color: '#fbbf24',
              marginTop: '4px'
            }}
          >
            {processingOrders} <span style={{ fontSize: '10px', color: '#666666', fontWeight: '500' }}>ORDERS</span>
          </div>
        </div>

        {/* মোট আইটেম বিক্রয় (ITEMS SOLD) */}
        <div
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #1a1a1a',
            padding: '12px 14px',
            borderRadius: '12px'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#888888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '500'
            }}
          >
            ITEMS SOLD
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginTop: '4px'
            }}
          >
            {totalItemsSold} <span style={{ fontSize: '10px', color: '#666666', fontWeight: '500' }}>PCS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
