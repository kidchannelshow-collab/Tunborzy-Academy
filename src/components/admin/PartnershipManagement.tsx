import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Tag, Award, Plus, Sparkles, ChevronRight, X, Phone, Mail, DollarSign, Shield } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Partner {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  referral_code: string;
  commission_percentage: number;
  created_at: string;
  referred_count?: number;
  premium_count?: number;
  commission_earned?: number;
  commission_paid?: number;
  commission_available?: number;
}

export default function PartnershipManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [commissionLedger, setCommissionLedger] = useState<any[]>([]);
  const [loadingReferred, setLoadingReferred] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'premium' | 'free'>('all');

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [commissionPct, setCommissionPct] = useState('20');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSelectPartner = async (partner: Partner) => {
    setSelectedPartner(partner);
    setLoadingReferred(true);
    try {
      // Fetch referred users
      const { data: usersData, error: usersErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, role, premium_status, payment_reference, payment_date')
        .eq('referred_by_partner_id', partner.id)
        .order('created_at', { ascending: false });

      if (usersErr) throw usersErr;
      setReferredUsers(usersData || []);

      // Fetch commission ledger entries for partner
      const { data: ledgerData, error: ledgerErr } = await supabase
        .from('partner_commission_ledger')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false });

      if (ledgerErr) throw ledgerErr;
      setCommissionLedger(ledgerData || []);
    } catch (err: any) {
      console.error('Error fetching partner details:', err);
      setReferredUsers([]);
      setCommissionLedger([]);
    } finally {
      setLoadingReferred(false);
    }
  };

  const fetchPartners = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Fetch partners
      const { data: partnersData, error: partnersErr } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (partnersErr) throw partnersErr;

      // Fetch all profiles to calculate referred and premium counts efficiently
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, referred_by_partner_id, premium_status');

      if (profilesErr) throw profilesErr;

      // Fetch payments table
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('user_id, status')
        .eq('status', 'successful');

      const paidUserIds = new Set((paymentsData || []).map((pay: any) => pay.user_id));

      // Fetch commission ledger
      const { data: ledgerData } = await supabase
        .from('partner_commission_ledger')
        .select('partner_id, commission_amount, status');

      // Fetch payouts
      const { data: payoutsData } = await supabase
        .from('partner_payouts')
        .select('partner_id, amount, status');

      // Aggregate counts and commissions
      const referredCounts = new Map<string, number>();
      const premiumCounts = new Map<string, number>();
      const earnedMap = new Map<string, number>();
      const paidMap = new Map<string, number>();

      (profilesData || []).forEach((p: any) => {
        if (p.referred_by_partner_id) {
          const current = referredCounts.get(p.referred_by_partner_id) || 0;
          referredCounts.set(p.referred_by_partner_id, current + 1);

          const isPremium = p.premium_status === 'Active' || p.premium_status === 'Premium' || p.premium_status === 'Pro' || paidUserIds.has(p.id);
          if (isPremium) {
            const pCurrent = premiumCounts.get(p.referred_by_partner_id) || 0;
            premiumCounts.set(p.referred_by_partner_id, pCurrent + 1);
          }
        }
      });

      (ledgerData || []).forEach((item: any) => {
        if (item.status === 'approved' || item.status === 'paid') {
          const currentEarned = earnedMap.get(item.partner_id) || 0;
          earnedMap.set(item.partner_id, currentEarned + Number(item.commission_amount || 0));
        }
      });

      (payoutsData || []).forEach((item: any) => {
        if (item.status === 'paid') {
          const currentPaid = paidMap.get(item.partner_id) || 0;
          paidMap.set(item.partner_id, currentPaid + Number(item.amount || 0));
        }
      });

      const enriched = (partnersData || []).map((pt: any) => {
        const earned = earnedMap.get(pt.id) || 0;
        const paid = paidMap.get(pt.id) || 0;
        const available = Math.max(0, earned - paid);

        return {
          ...pt,
          referred_count: referredCounts.get(pt.id) || 0,
          premium_count: premiumCounts.get(pt.id) || 0,
          commission_earned: earned,
          commission_paid: paid,
          commission_available: available
        };
      });

      setPartners(enriched);
    } catch (err: any) {
      console.error('Error fetching partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REF';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setReferralCode(code);
  };

  const filteredPartners = partners.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.full_name.toLowerCase().includes(q) || p.referral_code.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  const filteredReferredUsers = referredUsers.filter((u: any) => {
    const isPremium = u.premium_status === 'Active' || u.premium_status === 'Premium' || u.premium_status === 'Pro';
    if (userFilter === 'premium') return isPremium;
    if (userFilter === 'free') return !isPremium;
    return true;
  });

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim() || !email.trim() || !referralCode.trim()) {
      setErrorMsg('Full Name, Email, and Referral Code are required.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanCode = referralCode.trim().toUpperCase();

      // Check if code is already in use
      const { data: existing, error: checkErr } = await supabase
        .from('partners')
        .select('id')
        .eq('referral_code', cleanCode)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (existing) {
        setErrorMsg(`Referral code "${cleanCode}" is already in use by another partner. Please choose a different code.`);
        setSubmitting(false);
        return;
      }

      const { error: insertErr } = await supabase
        .from('partners')
        .insert([{
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          referral_code: cleanCode,
          commission_percentage: parseFloat(commissionPct) || 20.00
        }]);

      if (insertErr) throw insertErr;

      setSuccessMsg('Partner created successfully!');
      setFullName('');
      setEmail('');
      setPhone('');
      setReferralCode('');
      setCommissionPct('20');
      setShowAddModal(false);
      fetchPartners();
    } catch (err: any) {
      console.error('Error creating partner:', err);
      setErrorMsg(err.message || 'Failed to create partner.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <Users className="text-indigo-400" size={32} /> Partnership & Referral Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage institutional partners, unique referral codes, and referred user analytics.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/30 self-start md:self-auto"
        >
          <Plus size={16} /> Add Partner
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partners by name or code..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-indigo-500 pl-9"
          />
          <Users size={16} className="absolute left-3 top-3 text-slate-500" />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredPartners.length} of {partners.length} partners
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-display font-bold text-white text-lg">Active Partners Directory</h3>
          <span className="text-xs text-slate-400 font-medium">{filteredPartners.length} of {partners.length} Partners</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : partners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/50">
                  <th className="py-4 px-6">Partner</th>
                  <th className="py-4 px-6">Referral Code</th>
                  <th className="py-4 px-6">Referred Users</th>
                  <th className="py-4 px-6">Premium Users</th>
                  <th className="py-4 px-6">Commission</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredPartners.map((partner) => (
                  <tr 
                    key={partner.id} 
                    onClick={() => handleSelectPartner(partner)}
                    className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{partner.full_name}</div>
                      <div className="text-xs text-slate-400">{partner.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 font-mono text-xs font-bold">
                        {partner.referral_code}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg text-xs">
                        {partner.referred_count || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg text-xs border border-emerald-500/20">
                        {partner.premium_count || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-white font-bold text-xs">₦{(partner.commission_earned || 0).toLocaleString()}</div>
                      <div className="text-[11px] text-slate-400">Avail: <span className="text-amber-400 font-semibold">₦{(partner.commission_available || 0).toLocaleString()}</span></div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 text-slate-400 group-hover:text-white transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <Users size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-300 font-medium">No partners registered yet.</p>
            <p className="text-xs text-slate-500 mt-1">Click "Add Partner" to register your first institutional partner.</p>
          </div>
        )}
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
          >
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-display font-bold text-white mb-2">Register New Partner</h2>
            <p className="text-xs text-slate-400 mb-6">Create a unique referral code and tracking profile for a partner.</p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Partner Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Emmanuel Adebayo"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. emmanuel@example.com"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Phone Number (Optional)</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 801 234 5678"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Referral Code</label>
                  <button 
                    type="button" 
                    onClick={generateRandomCode}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Sparkles size={12} /> Generate Code
                  </button>
                </div>
                <input 
                  type="text" 
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EMMA20"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm uppercase focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Must be unique. Admin can manually type or generate code.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Commission Percentage (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Partner'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Partner Details Drawer / Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-6"
          >
            <button 
              onClick={() => setSelectedPartner(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Partner Profile
              </span>
              <h2 className="text-2xl font-display font-bold text-white mt-2">{selectedPartner.full_name}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Mail size={14} className="text-indigo-400" /> Email
                </div>
                <div className="text-white text-sm font-medium truncate">{selectedPartner.email}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Phone size={14} className="text-emerald-400" /> Phone
                </div>
                <div className="text-white text-sm font-medium">{selectedPartner.phone || 'Not provided'}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Tag size={14} className="text-amber-400" /> Referral Code
                </div>
                <div className="text-indigo-300 font-mono text-base font-bold">{selectedPartner.referral_code}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Award size={14} className="text-purple-400" /> Commission Rate
                </div>
                <div className="text-white text-base font-bold">{selectedPartner.commission_percentage}%</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-slate-800 pt-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Referred</div>
                <div className="text-xl font-display font-bold text-white">{selectedPartner.referred_count || 0}</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Premium</div>
                <div className="text-xl font-display font-bold text-emerald-400">{selectedPartner.premium_count || 0}</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Earned</div>
                <div className="text-sm font-display font-bold text-amber-400">₦{(selectedPartner.commission_earned || 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Commission Paid</div>
                <div className="text-sm font-display font-bold text-slate-300">₦{(selectedPartner.commission_paid || 0).toLocaleString()}</div>
              </div>
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Available Balance</div>
                <div className="text-sm font-display font-bold text-indigo-400">₦{(selectedPartner.commission_available || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Referred Users List */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Referred Users ({filteredReferredUsers.length}/{referredUsers.length})</h4>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${userFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setUserFilter('premium')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${userFilter === 'premium' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Premium
                  </button>
                  <button
                    onClick={() => setUserFilter('free')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${userFilter === 'free' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Not Premium
                  </button>
                </div>
              </div>

              {loadingReferred ? (
                <div className="py-4 text-center text-xs text-slate-500">Loading referred users...</div>
              ) : filteredReferredUsers.length > 0 ? (
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {filteredReferredUsers.map((u: any) => {
                    const isPremiumUser = u.premium_status === 'Active' || u.premium_status === 'Premium' || u.premium_status === 'Pro';
                    return (
                      <div key={u.id} className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-2">
                            {u.full_name || 'Unnamed User'}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPremiumUser ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                              {isPremiumUser ? 'Premium' : 'Free'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">{u.email} {u.payment_reference && `• Ref: ${u.payment_reference}`}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500">{new Date(u.created_at).toLocaleDateString()}</div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {u.role || 'Student'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                  No matching referred users found.
                </div>
              )}
            </div>

            {/* Commission Ledger Table */}
            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Commission Ledger ({commissionLedger.length})</h4>
              {commissionLedger.length > 0 ? (
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {commissionLedger.map((item: any) => (
                    <div key={item.id} className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-emerald-400 text-xs flex items-center gap-2">
                          +₦{Number(item.commission_amount).toLocaleString()} ({item.commission_rate * 100}%)
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase">
                            {item.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">Ref: {item.payment_reference} (Amt: ₦{Number(item.payment_amount).toLocaleString()})</div>
                      </div>
                      <div className="text-right text-[10px] text-slate-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                  No commission entries recorded yet.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPartner(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Profile
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
