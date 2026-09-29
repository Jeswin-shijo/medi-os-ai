import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner, BannerTab } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import { mockBillInvoices, mockAIBillingSuggestions } from '../../mock/billingData';
import { BillInvoice, BillItem } from '../../types';
import {
  Plus,
  Search,
  Printer,
  Send,
  ChevronDown,
  EllipsisVertical,
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  ShieldCheck,
  SquarePen,
  ClipboardPlus,
  ClipboardList,
  Download,
  Mail,
  MessageCircle,
  Smartphone,
  Wallet,
  ReceiptIndianRupee,
  FilePlus,
  CreditCard,
  SquareArrowUp,
  FileClock,
  Receipt,
  RotateCcw,
  SquareUserRound,
  FlaskConical
} from 'lucide-react';

type BillFilter = 'All Bills' | 'Unpaid' | 'Partially Paid' | 'Paid';
type AiTab = 'Suggestions' | 'Coding' | 'Insurance' | 'Patient Insights';
type Dot = 'check-green' | 'check-red' | 'ring-gray' | 'ring-orange' | 'ring-red';

const BILLING_TABS: BannerTab[] = [
  { id: 'billing', label: 'Billing Overview', icon: ReceiptIndianRupee },
  { id: 'create-bill', label: 'Create Bill', icon: FilePlus },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'insurance', label: 'Insurance', icon: SquareArrowUp },
  { id: 'estimates', label: 'Estimates', icon: FileClock },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
  { id: 'refunds', label: 'Refunds', icon: RotateCcw },
  { id: 'patient-ledger', label: 'Patient Ledger', icon: SquareUserRound },
  { id: 'reports', label: 'Reports', icon: FlaskConical }
];

/** List captions / status markers per bill, as shown in the design's bill list. */
const BILL_META: Record<string, { label: string; dot: Dot; paidOn?: string }> = {
  'b-1': { label: 'OPD Consultation', dot: 'check-green', paidOn: '23 Sep 2026 09:20 AM' },
  'b-2': { label: 'Lab Tests', dot: 'ring-gray' },
  'b-3': { label: 'Radiology (X-Ray)', dot: 'ring-gray' },
  'b-4': { label: 'Follow-up Consultation', dot: 'check-red' },
  'b-5': { label: 'OPD Consultation', dot: 'ring-orange' },
  'b-6': { label: 'Emergency', dot: 'check-green' },
  'b-7': { label: 'Consultation + Lab', dot: 'ring-red' }
};

const CATEGORY_CHIP: Record<BillItem['category'], { bg: string; fg: string }> = {
  Consultation: { bg: '#e3effd', fg: 'var(--blue-text)' },
  Lab: { bg: '#e2f6ec', fg: 'var(--green-dark)' },
  Radiology: { bg: '#efe6fe', fg: 'var(--purple-dark)' },
  Others: { bg: '#fdece2', fg: '#c2410c' },
  Administrative: { bg: 'var(--gray-pill-bg)', fg: 'var(--text-primary)' }
};

const AI_CONTENT: Record<AiTab, { title: string; items: string[] }> = {
  Suggestions: { title: 'AI Suggestions for this Bill', items: mockAIBillingSuggestions },
  Coding: {
    title: 'Suggested Billing Codes',
    items: [
      'I10 – Essential (primary) hypertension.',
      'E11.9 – Type 2 diabetes mellitus without complications.',
      'CPT 85025 – Complete blood count (CBC).',
      'CPT 71046 – Chest X-ray, 2 views.'
    ]
  },
  Insurance: {
    title: 'Insurance Insights',
    items: [
      'Star Health policy active till 31 Dec 2026.',
      'Lab and radiology items are claimable (₹1,250).',
      'Consultation fee covered under OPD rider.',
      'Attach prescription and reports for faster approval.'
    ]
  },
  'Patient Insights': {
    title: 'Patient Billing Insights',
    items: [
      '7 bills in the last 12 months, total ₹13,650.',
      'Prefers online card and UPI payments.',
      'One partially paid bill with ₹450 balance.',
      'Eligible for chronic care package discount.'
    ]
  }
};

const inr = (n: number) => n.toLocaleString('en-IN');
const splitDate = (d: string) => {
  const [date, time] = d.split(/,\s*/);
  return { date, time };
};

const StatusDot: React.FC<{ dot: Dot | 'selected' }> = ({ dot }) => {
  const color =
    dot === 'selected' ? 'var(--blue-primary)'
      : dot === 'check-green' ? 'var(--green-emerald)'
        : dot === 'check-red' || dot === 'ring-red' ? 'var(--red-rose)'
          : dot === 'ring-orange' ? 'var(--orange-amber)'
            : '#8a93a6';
  const filled = dot === 'selected' || dot.startsWith('check');
  return (
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: filled ? color : '#ffffff',
        border: filled ? 'none' : `3px solid ${color}`,
        marginTop: 4
      }}
    >
      {filled && <Check size={8} color="#ffffff" strokeWidth={4} />}
    </span>
  );
};

const menuStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 4px)',
  zIndex: 21,
  background: '#ffffff',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  boxShadow: 'var(--shadow-md)',
  padding: 4,
  minWidth: 170
};
const menuItem: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', fontSize: 12, borderRadius: 6, textAlign: 'left' };
const th: React.CSSProperties = { padding: '9px 8px', fontSize: 11, fontWeight: 600, background: 'var(--bg-subtle)' };
const td: React.CSSProperties = { padding: '5px 8px', fontSize: 11.5, borderBottom: '1px solid var(--border-subtle)' };
const right: React.CSSProperties = { textAlign: 'right' };

export const BillingScreen: React.FC = () => {
  const { showToast, activePatient, setActiveScreen } = useApp();
  const [bills, setBills] = useState<BillInvoice[]>(mockBillInvoices);
  const [selectedBillId, setSelectedBillId] = useState('b-1');
  const [billFilter, setBillFilter] = useState<BillFilter>('All Bills');
  const [searchBill, setSearchBill] = useState('');
  const [bannerTab, setBannerTab] = useState('billing');
  const [aiTab, setAiTab] = useState<AiTab>('Suggestions');
  const [openMenu, setOpenMenu] = useState<'send' | 'more' | null>(null);
  const [claimStatus, setClaimStatus] = useState<string>(activePatient?.insurance?.claimStatus ?? 'Not Claimed');

  const insurance = activePatient?.insurance ?? {
    provider: 'Star Health',
    policyNumber: 'SH123456',
    validity: '01 Jan 2026 – 31 Dec 2026',
    coverageType: 'Cashless / Reimbursement',
    claimStatus: 'Not Claimed'
  };

  const currentBill = bills.find((b) => b.id === selectedBillId) || bills[0];
  const billDate = splitDate(currentBill.billDate);
  const meta = BILL_META[currentBill.id];

  const filteredBills = bills.filter((b) => {
    const q = searchBill.toLowerCase();
    const matchesSearch =
      !q ||
      b.billNumber.toLowerCase().includes(q) ||
      b.billDate.toLowerCase().includes(q) ||
      (BILL_META[b.id]?.label ?? '').toLowerCase().includes(q) ||
      b.items.some((i) => i.service.toLowerCase().includes(q));
    return matchesSearch && (billFilter === 'All Bills' || b.status === billFilter);
  });

  const updateBill = (id: string, patch: Partial<BillInvoice>) =>
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const markPaid = () => {
    updateBill(currentBill.id, { status: 'Paid', paidAmount: currentBill.totalAmount, balanceDue: 0 });
    setOpenMenu(null);
    showToast(`${currentBill.billNumber} settled in full`);
  };

  const newBill = () => showToast('New invoice modal opened');

  const handleBannerTab = (id: string) => {
    setBannerTab(id);
    const tab = BILLING_TABS.find((t) => t.id === id);
    if (id === 'create-bill') newBill();
    else if (tab && id !== 'billing') showToast(`${tab.label} view opened`, 'info');
  };

  const paid = currentBill.status === 'Paid';
  const partial = currentBill.status === 'Partially Paid';
  const statusTone = paid ? 'var(--green-dark)' : partial ? 'var(--orange-dark)' : 'var(--red-dark)';
  const ai = AI_CONTENT[aiTab];

  return (
    <div className="page-scroll-body">
      <ScreenHeader title="Billing" subtitle="Create, manage and track patient billing, payments and invoices" />

      <PatientBanner
        metrics={[
          { label: 'Last Visit', value: activePatient?.lastVisit ?? '12 Sep 2026' },
          { label: 'Next Appointment', value: '26 Sep 2026', sub: '10:30 AM' },
          { label: 'Department', value: activePatient?.department ?? 'General Medicine' },
          { label: 'Insurance', value: insurance.provider, sub: `Policy: ${insurance.policyNumber}` }
        ]}
        action={
          <button className="btn-outline-blue patient-banner-action" style={{ minWidth: 154, marginLeft: 6 }} onClick={() => setActiveScreen('patients')}>
            <ClipboardList size={18} />
            <span>Patient Summary</span>
          </button>
        }
        tabs={BILLING_TABS}
        activeTab={bannerTab}
        onTabChange={handleBannerTab}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr) 330px', gap: 12, alignItems: 'stretch' }}>
        {/* Left column: bill list */}
        <div className="medios-card" style={{ padding: '10px 8px 10px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <button className="btn-primary" style={{ width: '100%', height: 34, fontSize: 12.5 }} onClick={newBill}>
            <Plus size={16} />
            <span>New Bill</span>
          </button>

          <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
            {(['All Bills', 'Unpaid', 'Partially Paid', 'Paid'] as const).map((tab) => (
              <button
                key={tab}
                className={`page-tab-btn ${billFilter === tab ? 'active' : ''}`}
                style={{ height: 31, padding: '0 6px', fontSize: 11, flex: tab === 'Partially Paid' ? '1.5 1 0' : '1 1 0', justifyContent: 'center', minWidth: 0 }}
                onClick={() => setBillFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', marginTop: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="input-field"
                style={{ height: 34, fontSize: 11, paddingLeft: 31, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                placeholder="Search by bill no, date or service..."
                value={searchBill}
                onChange={(e) => setSearchBill(e.target.value)}
              />
            </div>
            <button
              aria-label="Filter by date"
              className="icon-btn"
              style={{ width: 36, height: 34, borderRadius: '0 6px 6px 0', borderLeft: 'none' }}
              onClick={() => showToast('Filter bills by date range', 'info')}
            >
              <CalendarDays size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10, flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
            {filteredBills.map((b, i) => {
              const isSelected = selectedBillId === b.id;
              const m = BILL_META[b.id];
              const d = splitDate(b.billDate);
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBillId(b.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '12px minmax(0, 1fr) auto',
                    columnGap: 12,
                    alignItems: 'start',
                    textAlign: 'left',
                    padding: '9px 10px 9px 12px',
                    minHeight: 72,
                    borderRadius: isSelected ? 6 : 0,
                    background: isSelected ? '#e9f1fd' : 'transparent',
                    boxShadow: isSelected ? 'inset 2px 0 0 var(--blue-primary)' : 'none',
                    position: 'relative',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <StatusDot dot={isSelected ? 'selected' : m?.dot ?? 'ring-gray'} />
                  <div style={{ minWidth: 0, gridRow: 'span 2' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{b.billNumber}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'pre' }}>
                      {d.time ? `${d.date}  ${d.time}` : d.date}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{m?.label ?? `${b.visitType} Consultation`}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span
                      className={`status-pill ${b.status === 'Paid' ? 'paid' : b.status === 'Partially Paid' ? 'partially-paid' : 'red'}`}
                      style={{ height: 20, fontSize: 10.5, padding: b.status === 'Paid' ? '0 10px' : '0 6px' }}
                    >
                      {b.status}
                    </span>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>₹ {inr(b.totalAmount)}</span>
                  </div>
                  {!isSelected && i < filteredBills.length - 1 && selectedBillId !== filteredBills[i + 1]?.id && (
                    <span style={{ position: 'absolute', left: 36, right: 8, bottom: 0, height: 1, background: 'var(--border-subtle)' }} />
                  )}
                </button>
              );
            })}
            {filteredBills.length === 0 && (
              <div style={{ padding: '28px 8px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>No bills match this filter.</div>
            )}
          </div>

          <button className="btn-outline-blue" style={{ width: '100%', height: 35, fontSize: 12.5, marginTop: 8 }} onClick={() => showToast('All bills for this patient are loaded', 'info')}>
            Load More Bills
          </button>
        </div>

        {/* Center column: bill details */}
        <div className="medios-card" style={{ padding: '12px 12px 10px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <h3 style={{ fontSize: 19, fontWeight: 700 }}>Bill Details</h3>
              <span className={`status-pill ${paid ? 'paid' : partial ? 'partially-paid' : 'red'}`} style={{ height: 25, fontSize: 11.5, padding: '0 9px' }}>
                {paid ? <CircleCheck size={13} fill="currentColor" color="#ffffff" strokeWidth={2.4} /> : <Clock size={12} />}
                <span>{currentBill.status}</span>
              </span>
            </div>

            <div style={{ display: 'flex', gap: 9, position: 'relative' }}>
              <button className="btn-outline-blue" style={{ height: 37, fontSize: 12, padding: '0 14px' }} onClick={() => showToast('Printing invoice receipt')}>
                <Printer size={15} />
                <span>Print Bill</span>
              </button>
              <div style={{ position: 'relative' }}>
                <button className="btn-outline-blue" style={{ height: 37, fontSize: 12, padding: '0 12px 0 14px' }} onClick={() => setOpenMenu(openMenu === 'send' ? null : 'send')}>
                  <Send size={15} />
                  <span>Send to Patient</span>
                  <ChevronDown size={14} />
                </button>
                {openMenu === 'send' && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 20 }} onClick={() => setOpenMenu(null)} />
                    <div style={menuStyle}>
                      {[
                        { label: 'WhatsApp', icon: MessageCircle },
                        { label: 'Email', icon: Mail },
                        { label: 'SMS', icon: Smartphone }
                      ].map((o) => (
                        <button
                          key={o.label}
                          style={menuItem}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => {
                            setOpenMenu(null);
                            showToast(`Invoice ${currentBill.billNumber} sent via ${o.label}`);
                          }}
                        >
                          <o.icon size={13} />
                          <span>Send via {o.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <button aria-label="More bill actions" className="icon-btn" style={{ width: 34, height: 37 }} onClick={() => setOpenMenu(openMenu === 'more' ? null : 'more')}>
                  <EllipsisVertical size={16} />
                </button>
                {openMenu === 'more' && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 20 }} onClick={() => setOpenMenu(null)} />
                    <div style={menuStyle}>
                      <button
                        style={menuItem}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => {
                          setOpenMenu(null);
                          showToast(`${currentBill.billNumber}.pdf downloaded`);
                        }}
                      >
                        <Download size={13} />
                        <span>Download PDF</span>
                      </button>
                      {!paid && (
                        <button
                          style={menuItem}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          onClick={markPaid}
                        >
                          <Wallet size={13} />
                          <span>Record Full Payment</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Meta strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.45fr 1.05fr 0.8fr 1.6fr 0.88fr 1fr',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              marginTop: 10,
              minHeight: 66
            }}
          >
            {[
              { label: 'Bill Number', value: currentBill.billNumber },
              { label: 'Bill Date', value: billDate.date, sub: billDate.time },
              { label: 'Visit Type', value: currentBill.visitType },
              { label: 'Consultation ID', value: currentBill.consultationId },
              { label: 'Created By', value: currentBill.createdBy },
              { label: 'Payment Mode', value: currentBill.paymentMode }
            ].map((c, i) => (
              <div key={c.label} style={{ padding: '10px 6px 8px 7px', borderLeft: i === 0 ? 'none' : '1px solid var(--border-subtle)', minWidth: 0 }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{c.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 4, whiteSpace: 'nowrap' }}>{c.value}</div>
                {c.sub && <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3 }}>{c.sub}</div>}
              </div>
            ))}
          </div>

          {/* Items table */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, marginTop: 10, overflow: 'hidden' }}>
            <table className="medios-table">
              <thead>
                <tr>
                  <th style={{ ...th, width: 34, paddingLeft: 10 }}>#</th>
                  <th style={th}>Service / Item</th>
                  <th style={th}>Category</th>
                  <th style={th}>Qty</th>
                  <th style={{ ...th, ...right }}>Unit Price (₹)</th>
                  <th style={{ ...th, ...right }}>Discount (₹)</th>
                  <th style={{ ...th, ...right, paddingRight: 10 }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {currentBill.items.map((item, idx) => {
                  const chip = CATEGORY_CHIP[item.category];
                  const last = idx === currentBill.items.length - 1;
                  const cell = { ...td, paddingTop: 7, ...(last ? { borderBottom: 'none' } : null) };
                  return (
                    <tr key={item.id}>
                      <td style={{ ...cell, paddingLeft: 10, verticalAlign: 'top' }}>{idx + 1}</td>
                      <td style={{ ...cell, verticalAlign: 'top' }}>
                        <div>{item.service}</div>
                        {item.subCategory && <div style={{ color: 'var(--text-secondary)', marginTop: 3 }}>{item.subCategory}</div>}
                      </td>
                      <td style={{ ...cell, paddingTop: 5, verticalAlign: 'top' }}>
                        <span className="status-pill" style={{ background: chip.bg, color: chip.fg, minWidth: 66, justifyContent: 'flex-start', height: 21, fontSize: 11 }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ ...cell, verticalAlign: 'top' }}>{item.qty}</td>
                      <td style={{ ...cell, ...right, verticalAlign: 'top' }}>{inr(item.unitPrice)}</td>
                      <td style={{ ...cell, ...right, verticalAlign: 'top' }}>{inr(item.discount)}</td>
                      <td style={{ ...cell, ...right, paddingRight: 10, verticalAlign: 'top' }}>{inr(item.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <div style={{ width: 186, marginRight: 10, display: 'flex', flexDirection: 'column', fontSize: 12 }}>
              {[
                { label: 'Subtotal', value: currentBill.subtotal, style: { fontWeight: 600 } },
                { label: 'Discount', value: currentBill.discount, style: { color: 'var(--text-secondary)' } },
                { label: 'Tax (GST 0%)', value: currentBill.tax, style: { color: 'var(--text-secondary)' } },
                { label: 'Total Amount', value: currentBill.totalAmount, style: { fontWeight: 600 } },
                { label: 'Paid Amount', value: currentBill.paidAmount, style: { fontWeight: 600, color: 'var(--green-dark)' } },
                { label: 'Balance Due', value: currentBill.balanceDue, style: { fontWeight: 600, color: 'var(--red-rose)' } }
              ].map((r, i, arr) => (
                <div
                  key={r.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                    ...r.style
                  }}
                >
                  <span>{r.label}</span>
                  <span style={{ color: r.label === 'Discount' || r.label.startsWith('Tax') ? 'var(--text-primary)' : undefined }}>{inr(r.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 10px 10px', marginTop: 'auto' }}>
            <label htmlFor="bill-notes" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Notes
            </label>
            <textarea
              id="bill-notes"
              className="input-field"
              style={{ minHeight: 60, height: 60, fontSize: 11.5, padding: '8px 8px', resize: 'none', borderColor: 'var(--border-subtle)' }}
              value={currentBill.notes}
              onChange={(e) => updateBill(currentBill.id, { notes: e.target.value })}
            />
          </div>
        </div>

        {/* Right column: payment status, insurance, AI billing assistant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="medios-card" style={{ padding: '12px 14px 10px' }}>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>Payment Status</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 5 }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: paid ? 'var(--green-emerald)' : partial ? 'var(--orange-amber)' : 'var(--red-rose)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2
                }}
              >
                {paid ? <Check size={16} color="#ffffff" strokeWidth={3} /> : <Clock size={15} color="#ffffff" strokeWidth={2.5} />}
              </span>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: statusTone }}>{paid ? 'Fully Paid' : partial ? 'Partially Paid' : 'Payment Pending'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                  {paid
                    ? `Payment completed on ${meta?.paidOn ?? billDate.date}`
                    : `₹ ${inr(currentBill.balanceDue)} outstanding since ${billDate.date}`}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '7px 12px', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { label: 'Total Amount', value: currentBill.totalAmount, color: 'var(--text-primary)' },
                { label: 'Paid Amount', value: currentBill.paidAmount, color: 'var(--green-dark)' },
                { label: 'Balance Due', value: currentBill.balanceDue, color: 'var(--red-rose)' }
              ].map((r) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                  <span>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>₹ {inr(r.value)}</span>
                </div>
              ))}
            </div>

            <button className="btn-outline-blue" style={{ width: '100%', height: 34, fontSize: 12, marginTop: 9 }} onClick={() => showToast('Online transaction receipt generated')}>
              View Payment Details
            </button>

            <div className="divider" style={{ margin: '9px -14px 9px' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={16} color="#ffffff" fill="var(--blue-primary)" strokeWidth={2} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>Insurance Details</span>
              </div>
              <button className="btn-outline-blue" style={{ height: 28, fontSize: 11.5, padding: '0 9px', gap: 6 }} onClick={() => showToast('Insurance details editing enabled', 'info')}>
                <SquarePen size={13} />
                <span>Edit</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 3, fontSize: 12, marginTop: 6 }}>
              <span>Insurance Provider</span>
              <span>{insurance.provider}</span>
              <span>Policy Number</span>
              <span>{insurance.policyNumber}</span>
              <span>Validity</span>
              <span>{insurance.validity}</span>
              <span>Coverage Type</span>
              <span>{insurance.coverageType}</span>
              <span>Claim Status</span>
              <span style={{ color: claimStatus === 'Not Claimed' ? '#e8590c' : 'var(--blue-text)' }}>{claimStatus}</span>
            </div>

            <button
              className="btn-outline-blue"
              style={{ width: '100%', height: 34, fontSize: 11.5, marginTop: 10 }}
              onClick={() => {
                setClaimStatus('In Progress');
                showToast('Insurance pre-authorization claim initiated');
              }}
            >
              <ClipboardPlus size={14} />
              <span>Initiate Insurance Claim</span>
            </button>
          </div>

          <div className="ai-assistant-card" style={{ padding: '10px 12px 9px', gap: 7, flex: 1 }}>
            <div className="ai-title-row" style={{ fontSize: 14, gap: 8, paddingLeft: 2 }}>
              <AiSparkle size={20} />
              <span>AI Billing Assistant (GPT-6 Astro)</span>
            </div>

            <div style={{ display: 'flex', gap: 5 }}>
              {(Object.keys(AI_CONTENT) as AiTab[]).map((t) => (
                <button
                  key={t}
                  className={`page-tab-btn ${aiTab === t ? 'active' : ''}`}
                  style={{ height: 31, padding: '0 6px', fontSize: 11, flex: t === 'Patient Insights' ? '1.4 1 0' : '1 1 0', justifyContent: 'center', minWidth: 0 }}
                  onClick={() => setAiTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <div className="ai-section-title" style={{ fontSize: 11, marginBottom: 6 }}>
                <AiSparkle size={13} />
                <span>{ai.title}</span>
              </div>
              <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 10.5, color: 'var(--text-primary)', paddingLeft: 2 }}>
                {ai.items.map((s, i) => (
                  <li key={s} style={{ display: 'flex', gap: 7 }}>
                    <span style={{ fontWeight: 600, minWidth: 11 }}>{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
              <button className="btn-primary" style={{ width: 156, height: 36, fontSize: 12.5 }} onClick={() => showToast('CPT / ICD-10 medical billing codes applied')}>
                Apply Suggestions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
