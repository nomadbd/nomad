import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

export function useAmbassador(ambassadorData: any) {
  const [slug, setSlug] = useState(ambassadorData?.assigned_slug || '');
  const [isEditingSlug, setIsEditingSlug] = useState(!ambassadorData?.assigned_slug);
  const [slugMsg, setSlugMsg] = useState({ type: '', text: '' });
  const [savingSlug, setSavingSlug] = useState(false);

  const [unpaidBalance, setUnpaidBalance] = useState(ambassadorData?.unpaid_balance || 0);
  const [totalEarned, setTotalEarned] = useState(ambassadorData?.total_earned || 0);

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [payoutMsg, setPayoutMsg] = useState({ type: '', text: '' });
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);

  const [assignedProducts, setAssignedProducts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (ambassadorData?.id) {
      fetchDashboardDetails();
    }
  }, [ambassadorData?.id]);

  const fetchDashboardDetails = async () => {
    try {
      setLoadingData(true);

      const { data: amb } = await supabase
        .from('ambassador')
        .select('unpaid_balance, total_earned, assigned_slug')
        .eq('id', ambassadorData.id)
        .single();

      if (amb) {
        setUnpaidBalance(amb.unpaid_balance || 0);
        setTotalEarned(amb.total_earned || 0);
        if (amb.assigned_slug) {
          setSlug(amb.assigned_slug);
          setIsEditingSlug(false);
        }
      }

      const { data: payouts } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('ambassador_id', ambassadorData.id)
        .order('created_at', { ascending: false });

      if (payouts) setPayoutRequests(payouts);

      const { data: products } = await supabase
        .from('ambassador_products')
        .select('product_id, products(*)')
        .eq('ambassador_id', ambassadorData.id);

      if (products) {
        setAssignedProducts(products.map((p: any) => p.products).filter(Boolean));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveSlug = async () => {
    const formattedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!formattedSlug) {
      setSlugMsg({ type: 'error', text: 'Please enter a valid slug' });
      return;
    }

    try {
      setSavingSlug(true);
      setSlugMsg({ type: '', text: '' });

      const { data: existing } = await supabase
        .from('ambassador')
        .select('id')
        .eq('assigned_slug', formattedSlug)
        .neq('id', ambassadorData.id)
        .maybeSingle();

      if (existing) {
        setSlugMsg({ type: 'error', text: 'This URL slug is already taken.' });
        return;
      }

      const { error } = await supabase
        .from('ambassador')
        .update({ assigned_slug: formattedSlug })
        .eq('id', ambassadorData.id);

      if (error) throw error;

      setSlug(formattedSlug);
      setIsEditingSlug(false);
      setSlugMsg({ type: 'success', text: 'Custom link updated successfully!' });
    } catch (err: any) {
      setSlugMsg({ type: 'error', text: err.message || 'Failed to update link' });
    } finally {
      setSavingSlug(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payoutAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setPayoutMsg({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }

    if (amountNum > unpaidBalance) {
      setPayoutMsg({ type: 'error', text: 'Amount exceeds available unpaid balance.' });
      return;
    }

    if (!payoutDetails.trim()) {
      setPayoutMsg({ type: 'error', text: 'Please provide payment details (e.g. bKash number).' });
      return;
    }

    try {
      setSubmittingPayout(true);
      setPayoutMsg({ type: '', text: '' });

      const { data, error } = await supabase
        .from('payout_requests')
        .insert([
          {
            ambassador_id: ambassadorData.id,
            amount: amountNum,
            payout_details: payoutDetails.trim(),
            status: 'PENDING'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setPayoutRequests([data, ...payoutRequests]);
      setPayoutAmount('');
      setPayoutDetails('');
      setPayoutMsg({ type: 'success', text: 'Payout request submitted successfully!' });
    } catch (err: any) {
      setPayoutMsg({ type: 'error', text: err.message || 'Failed to submit request.' });
    } finally {
      setSubmittingPayout(false);
    }
  };

  return {
    slug,
    setSlug,
    isEditingSlug,
    setIsEditingSlug,
    slugMsg,
    savingSlug,
    unpaidBalance,
    totalEarned,
    payoutAmount,
    setPayoutAmount,
    payoutDetails,
    setPayoutDetails,
    payoutMsg,
    submittingPayout,
    payoutRequests,
    assignedProducts,
    loadingData,
    handleSaveSlug,
    handleRequestPayout
  };
}
