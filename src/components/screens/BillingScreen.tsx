import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { mockBillInvoices, mockAIBillingSuggestions } from '../../mock/billingData';
import { BillInvoice } from '../../types';
import {
  Plus,
  Search,
  Printer,
  Send,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Download,
  CreditCard,
  Edit2
} from 'lucide-react';

export const BillingScreen: React.FC = () => {
  const { showToast } = useApp();
  const [bills, setBills] = useState<BillInvoice[]>(mockBillInvoices);
  const [selectedBillId, setSelectedBillId] = useState('b-1');
  const [billFilter, setBillFilter] = useState<'All Bills' | 'Unpaid' | 'Partially Paid' | 'Paid'>('All Bills');
  const [searchBill, setSearchBill] = useState('');

  const currentBill = bills.find(b => b.id === selectedBillId) || bills[0];

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.billNumber.toLowerCase().includes(searchBill.toLowerCase()) || b.items.some(i => i.service.toLowerCase().includes(searchBill.toLowerCase()));
    if (billFilter === 'All Bills') return matchesSearch;
    if (billFilter === 'Paid') return matchesSearch && b.status === 'Paid';
    if (billFilter === 'Partially Paid') return matchesSearch && b.status === 'Partially Paid';
    if (billFilter === 'Unpaid') return matchesSearch && b.status === 'Unpaid';
    return matchesSearch;
  });

  return (
    <div className="page-scroll-body">
      <PatientBanner currentSubtab="billing" />

      {/* Screen Header */}
      <div className="screen-header-row" style={{ marginTop: '4px' }}>
        <div className="screen-title-area">
          <h1 style={{ fontSize: '1.4rem' }}>Billing</h1>
          <p>Create, manage and track patient billing, payments and invoices</p>
        </div>
      </div>

      {/* 3-Column Billing Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1.5fr 1fr', gap: '20px' }}>
        {/* Left Column: Bills List */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => showToast('New invoice modal opened')}
          >
            <Plus size={16} />
            <span>New Bill</span>
          </button>

          {/* Subtabs: All Bills, Unpaid, Partially Paid, Paid */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
            {(['All Bills', 'Unpaid', 'Partially Paid', 'Paid'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setBillFilter(tab)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: billFilter === tab ? '#2563eb' : '#f1f5f9',
                  color: billFilter === tab ? '#ffffff' : '#64748b',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} className="search-icon-left" />
            <input
              type="text"
              className="global-search-input"
              style={{ width: '100%', height: '32px', fontSize: '0.76rem' }}
              placeholder="Search by bill no, date or service..."
              value={searchBill}
              onChange={(e) => setSearchBill(e.target.value)}
            />
          </div>

          {/* Bills List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '560px' }}>
            {filteredBills.map(b => {
              const isSelected = selectedBillId === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBillId(b.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{b.billNumber}</span>
                    <span className={`status-pill ${b.status === 'Paid' ? 'completed' : 'waiting'}`} style={{ fontSize: '0.66rem' }}>
                      {b.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{b.billDate}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.74rem', color: '#475569' }}>{b.visitType} Consultation</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>₹ {b.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.74rem', marginTop: 'auto' }}>
            Load More Bills
          </button>
        </div>

        {/* Center Column: Itemized Bill Details */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Bill Details</h3>
              <span className="status-pill completed">{currentBill.status}</span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 10px' }} onClick={() => showToast('Printing invoice receipt')}>
                <Printer size={12} />
                <span>Print Bill</span>
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 10px' }} onClick={() => showToast('Invoice dispatched via WhatsApp & Email')}>
                <Send size={12} />
                <span>Send to Patient ▼</span>
              </button>
            </div>
          </div>

          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.76rem' }}>
            <div>
              <div style={{ color: '#64748b' }}>Bill Number</div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{currentBill.billNumber}</div>
            </div>
            <div>
              <div style={{ color: '#64748b' }}>Bill Date</div>
              <div style={{ fontWeight: 600 }}>{currentBill.billDate}</div>
            </div>
            <div>
              <div style={{ color: '#64748b' }}>Visit Type</div>
              <div style={{ fontWeight: 600 }}>{currentBill.visitType}</div>
            </div>
            <div>
              <div style={{ color: '#64748b' }}>Consultation ID</div>
              <div style={{ fontWeight: 600 }}>{currentBill.consultationId}</div>
            </div>
            <div>
              <div style={{ color: '#64748b' }}>Created By</div>
              <div style={{ fontWeight: 600 }}>{currentBill.createdBy}</div>
            </div>
            <div>
              <div style={{ color: '#64748b' }}>Payment Mode</div>
              <div style={{ fontWeight: 700, color: '#2563eb' }}>{currentBill.paymentMode}</div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="medios-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: '20px' }}>#</th>
                <th>Service / Item</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Unit Price (₹)</th>
                <th>Discount (₹)</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {currentBill.items.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.service}</div>
                    {item.subCategory && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.subCategory}</div>}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          item.category === 'Consultation' ? '#eff6ff' : item.category === 'Lab' ? '#ecfdf5' : '#f5f3ff',
                        color:
                          item.category === 'Consultation' ? '#1d4ed8' : item.category === 'Lab' ? '#047857' : '#6d28d9'
                      }}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td>{item.qty}</td>
                  <td>{item.unitPrice}</td>
                  <td>{item.discount}</td>
                  <td style={{ fontWeight: 700 }}>{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Breakdown */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
            <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Subtotal</span>
                <span>₹ {currentBill.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Discount</span>
                <span>₹ {currentBill.discount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Tax (GST 0%)</span>
                <span>₹ {currentBill.tax}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.96rem', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span>Total Amount</span>
                <span>₹ {currentBill.totalAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#059669' }}>
                <span>Paid Amount</span>
                <span>₹ {currentBill.paidAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: currentBill.balanceDue > 0 ? '#dc2626' : '#64748b' }}>
                <span>Balance Due</span>
                <span>₹ {currentBill.balanceDue}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>
              Notes:
            </span>
            <p style={{ fontSize: '0.76rem', color: '#334155' }}>
              {currentBill.notes}
            </p>
          </div>
        </div>

        {/* Right Column: Payment Status, Insurance Details & AI Billing Assistant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Payment Status Card */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
              Payment Status
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ecfdf5', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              <CheckCircle2 size={24} color="#059669" />
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#065f46' }}>Fully Paid</div>
                <div style={{ fontSize: '0.7rem', color: '#047857' }}>Payment completed on 23 Sep 2026 09:20 AM</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Amount</span>
                <strong style={{ color: '#0f172a' }}>₹ 1,850</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Paid Amount</span>
                <strong style={{ color: '#059669' }}>₹ 1,850</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Balance Due</span>
                <strong style={{ color: '#0f172a' }}>₹ 0</strong>
              </div>
            </div>

            <button
              className="btn-secondary"
              style={{ width: '100%', marginTop: '12px', justifyContent: 'center', fontSize: '0.74rem' }}
              onClick={() => showToast('Online transaction receipt generated')}
            >
              View Payment Details
            </button>
          </div>

          {/* Insurance Details Card */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#2563eb" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Insurance Details</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer' }}><Edit2 size={12} /></span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Insurance Provider</span>
                <strong>Star Health</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Policy Number</span>
                <strong>SH123456</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Validity</span>
                <span>01 Jan 2026 – 31 Dec 2026</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Coverage Type</span>
                <span>Cashless / Reimbursement</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Claim Status</span>
                <span style={{ color: '#d97706', fontWeight: 600 }}>Not Claimed</span>
              </div>
            </div>

            <button
              className="btn-outline-blue"
              style={{ width: '100%', marginTop: '10px', justifyContent: 'center', fontSize: '0.74rem' }}
              onClick={() => showToast('Insurance pre-authorization claim initiated')}
            >
              Initiate Insurance Claim
            </button>
          </div>

          {/* AI Billing Assistant */}
          <div className="ai-assistant-card">
            <div className="ai-header-bar">
              <div className="ai-title-row">
                <Sparkles size={16} />
                <span>AI Billing Assistant (GPT-6 Astro)</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7e22ce', marginBottom: '6px' }}>
                ✦ AI Suggestions for this Bill
              </div>
              <ol style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {mockAIBillingSuggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: '8px', fontSize: '0.74rem', justifyContent: 'center' }}
                onClick={() => showToast('CPT / ICD-10 medical billing codes applied')}
              >
                Apply Suggestions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
