import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { mockFollowUps, mockAIFollowUpRecommendations } from '../../mock/followUpsData';
import { FollowUpItem } from '../../types';
import {
  CalendarDays,
  Plus,
  Search,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Bell
} from 'lucide-react';

export const FollowUpsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(mockFollowUps);
  const [selectedId, setSelectedId] = useState('fu-1');
  const [subTab, setSubTab] = useState('Follow-up List');
  const [search, setSearch] = useState('');

  const selectedItem = followUps.find(f => f.id === selectedId) || followUps[0];

  const filtered = followUps.filter(f => {
    const matchesSearch = f.patientName.toLowerCase().includes(search.toLowerCase()) ||
      f.uhid.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (subTab === 'Pending Follow-ups') return f.status === 'Pending' || f.status === 'Scheduled';
    if (subTab === 'Missed Follow-ups') return f.status === 'Missed' || f.status === 'Overdue';
    if (subTab === 'Recalls') return f.followUpType.toLowerCase().includes('recall') || f.status === 'Completed';
    return true;
  });

  return (
    <div className="page-scroll-body">
      <PatientBanner currentSubtab="follow-ups" />

      {/* Screen Header */}
      <div className="screen-header-row" style={{ marginTop: '4px' }}>
        <div className="screen-title-area">
          <h1 style={{ fontSize: '1.4rem' }}>Follow-ups</h1>
          <p>Schedule, track and manage patient follow-ups with AI assistance</p>
        </div>
        <div className="screen-header-actions">
          <button className="btn-secondary" onClick={() => showToast('Opening follow-up scheduler')}>
            <CalendarDays size={16} />
            <span>Schedule Follow-up</span>
          </button>
          <button className="btn-primary" onClick={() => showToast('New follow-up created')}>
            <Plus size={16} />
            <span>New Follow-up</span>
          </button>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
        {[
          'Follow-up List',
          'Calendar View',
          'Pending Follow-ups',
          'Missed Follow-ups',
          'Recalls',
          'Automated Reminders',
          'Follow-up Templates',
          'Analytics'
        ].map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: subTab === tab ? '#2563eb' : 'transparent',
              color: subTab === tab ? '#ffffff' : '#64748b',
              borderRadius: '6px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#334155' }}>
          <Calendar size={14} color="#64748b" />
          <span>01 Sep 2026 – 30 Dec 2026</span>
        </div>

        <select style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc' }}>
          <option>All Types</option>
          <option>Review</option>
          <option>Lab Review</option>
          <option>Medication Review</option>
        </select>

        <select style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#f8fafc' }}>
          <option>All Status</option>
          <option>Scheduled</option>
          <option>Completed</option>
          <option>Pending</option>
          <option>Missed</option>
        </select>

        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} className="search-icon-left" />
          <input
            type="text"
            className="global-search-input"
            style={{ width: '100%', height: '32px', fontSize: '0.76rem' }}
            placeholder="Search by patient name, UHID, diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 2-Column Layout: Table + Follow-up Calendar on Left, Detail Drawer on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px' }}>
        {/* Left Column: Table & Bottom Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="medios-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="medios-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '20px' }}>#</th>
                  <th>Patient</th>
                  <th>Last Visit</th>
                  <th>Follow-up Date</th>
                  <th>Follow-up Type</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const isSelected = selectedId === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={isSelected ? 'selected' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                            {item.patientName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.patientName}</div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.uhid} • {item.age} yrs | {item.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td>{item.lastVisit}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.followUpDate}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.followUpTime}</div>
                      </td>
                      <td>{item.followUpType}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            item.status === 'Scheduled'
                              ? 'checked-in'
                              : item.status === 'Completed'
                              ? 'completed'
                              : item.status === 'Pending'
                              ? 'waiting'
                              : 'critical'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>{item.assignedTo}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={{ color: '#2563eb' }}><Calendar size={14} /></button>
                          <button style={{ color: '#64748b' }}><MoreVertical size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Follow-up Calendar (This Month) */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Follow-up Calendar (This Month)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button style={{ padding: '2px 4px' }}><ChevronLeft size={14} /></button>
                <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Sep 2026</span>
                <button style={{ padding: '2px 4px' }}><ChevronRight size={14} /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Sun 20</div>
                <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, marginTop: '4px' }}>09:00 AM</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600 }}>Selvi P</div>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Chronic Care</div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Mon 21</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '10px' }}>No events</div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Tue 22</div>
                <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700, marginTop: '4px' }}>11:30 AM</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600 }}>Rajesh Kumar</div>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Medication Review</div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Wed 23</div>
                <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, marginTop: '4px' }}>10:00 AM</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600 }}>Mary Jeni</div>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Lab Review</div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Thu 24</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '10px' }}>No events</div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Fri 25</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '10px' }}>No events</div>
              </div>

              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Sat 26</div>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: '4px' }}>10:30 AM</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600 }}>Arun Kumar</div>
                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Review</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Follow-up Details & AI Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Details Card */}
          <div className="medios-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>Follow-up Details</span>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                <Edit2 size={12} />
                <span>Edit</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                alt={selectedItem.patientName}
                style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #3b82f6', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{selectedItem.patientName}</h4>
                <p style={{ fontSize: '0.72rem', color: '#64748b' }}>UHID: {selectedItem.uhid} • {selectedItem.age} yrs | {selectedItem.gender}</p>
                <p style={{ fontSize: '0.7rem', color: '#64748b' }}>+91 98765 43210</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Follow-up Date:</span>
                <strong>{selectedItem.followUpDate}, {selectedItem.followUpTime}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Follow-up Type:</span>
                <span>Review Consultation</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Status:</span>
                <span className="status-pill checked-in" style={{ fontSize: '0.65rem' }}>{selectedItem.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Assigned To:</span>
                <span>{selectedItem.assignedTo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '6px 8px', borderRadius: '6px' }}>
                <span style={{ color: '#64748b' }}>Reminder:</span>
                <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.72rem' }}>1 day before (SMS + WhatsApp)</span>
              </div>
            </div>

            {/* Previous Visits */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Previous Visits</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>✓ 12 Sep 2026 OPD Consultation</span>
                  <span style={{ fontSize: '0.7rem', color: '#2563eb' }}>View</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>✓ 18 Aug 2026 Follow-up (Lab review)</span>
                  <span style={{ fontSize: '0.7rem', color: '#2563eb' }}>View</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>✓ 10 Jul 2026 Initial Consultation</span>
                  <span style={{ fontSize: '0.7rem', color: '#2563eb' }}>View</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Follow-up Recommendations (GPT-6 Astro) */}
          <div className="ai-assistant-card">
            <div className="ai-header-bar">
              <div className="ai-title-row">
                <Sparkles size={16} />
                <span>AI Follow-up Recommendations (GPT-6 Astro)</span>
              </div>
            </div>

            <ol style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {mockAIFollowUpRecommendations.map((rec, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => showToast(`Added: ${rec}`)}>
                  <span>{rec}</span>
                  <ChevronRight size={14} color="#7e22ce" />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
