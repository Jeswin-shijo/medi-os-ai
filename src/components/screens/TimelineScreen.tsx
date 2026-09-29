import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { mockTimelineEvents } from '../../mock/timelineData';
import { TimelineEvent } from '../../types';
import {
  History,
  Search,
  Filter,
  Calendar,
  UserCheck,
  FlaskConical,
  ImageIcon,
  Pill,
  HeartPulse,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export const TimelineScreen: React.FC = () => {
  const { activePatient, showToast, setActiveScreen } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>('All Events');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'tl-1': true,
    'tl-2': true,
    'tl-3': true
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Consultation' | 'Lab' | 'Imaging' | 'Prescription' | 'Vitals' | 'Emergency'>('Consultation');
  const [newNotes, setNewNotes] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(mockTimelineEvents);

  if (!activePatient) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3>No active patient selected</h3>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filterTabs = [
    'All Events',
    'Consultations',
    'Lab Orders',
    'Imaging',
    'Prescriptions',
    'Vitals Checks',
    'Emergency'
  ];

  const filteredEvents = timelineEvents.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.details?.diagnosis && event.details.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'All Events') return true;
    if (selectedFilter === 'Consultations') return event.category === 'Consultation';
    if (selectedFilter === 'Lab Orders') return event.category === 'Lab';
    if (selectedFilter === 'Imaging') return event.category === 'Imaging';
    if (selectedFilter === 'Prescriptions') return event.category === 'Prescription';
    if (selectedFilter === 'Vitals Checks') return event.category === 'Vitals';
    if (selectedFilter === 'Emergency') return event.category === 'Emergency';
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Consultation':
        return <UserCheck size={16} color="#2563eb" />;
      case 'Lab':
        return <FlaskConical size={16} color="#d97706" />;
      case 'Imaging':
        return <ImageIcon size={16} color="#7c3aed" />;
      case 'Prescription':
        return <Pill size={16} color="#0891b2" />;
      case 'Vitals':
        return <HeartPulse size={16} color="#059669" />;
      case 'Emergency':
        return <AlertTriangle size={16} color="#dc2626" />;
      default:
        return <History size={16} color="#64748b" />;
    }
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please enter an event title', 'warning');
      return;
    }

    const newEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      uhid: activePatient.uhid,
      date: 'Today, 26 Sep 2026',
      time: 'Just now',
      category: newCategory,
      title: newTitle,
      subtitle: 'Manual Clinical Entry',
      doctor: 'Dr. Shajin',
      department: 'General Medicine',
      status: 'Completed',
      badgeColor: '#2563eb',
      details: {
        notes: newNotes
      }
    };

    setTimelineEvents([newEvent, ...timelineEvents]);
    setExpandedIds(prev => ({ ...prev, [newEvent.id]: true }));
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewNotes('');
    showToast('Clinical milestone recorded successfully');
  };

  return (
    <div className="page-scroll-body">
      {/* Patient Workstation Banner with Subtabs */}
      <PatientBanner currentSubtab="timeline" />

      {/* Screen Title & Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="#2563eb" />
            <span>Patient Longitudinal Timeline</span>
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
            Comprehensive chronological health journey, clinical encounters, diagnostics, and prescriptions for {activePatient.name}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.76rem', padding: '6px 12px' }}
            onClick={() => showToast('Timeline exported as clinical summary PDF')}
          >
            <Download size={14} />
            <span>Export Summary</span>
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.76rem', padding: '6px 12px' }}
            onClick={() => window.print()}
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
          <button
            className="btn-primary"
            style={{ fontSize: '0.76rem', padding: '6px 14px' }}
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={14} />
            <span>Add Event / Note</span>
          </button>
        </div>
      </div>

      {/* Quick Metric Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div className="medios-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History size={18} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Events</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{timelineEvents.length}</div>
          </div>
        </div>

        <div className="medios-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={18} color="#1d4ed8" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Consultations</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>3 Visits</div>
          </div>
        </div>

        <div className="medios-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlaskConical size={18} color="#d97706" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Lab Panels</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>1 Panel (4 Tests)</div>
          </div>
        </div>

        <div className="medios-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageIcon size={18} color="#7c3aed" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Imaging Studies</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>2 Studies</div>
          </div>
        </div>

        <div className="medios-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pill size={18} color="#0284c7" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Prescriptions</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>4 Active Rx</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filterTabs.map((tab) => {
            const isSelected = selectedFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', minWidth: '260px', flex: '0 1 300px' }}>
          <Search size={14} className="search-icon-left" />
          <input
            type="text"
            className="global-search-input"
            style={{ width: '100%', height: '34px', fontSize: '0.78rem' }}
            placeholder="Search events, diagnosis, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Interactive Longitudinal Timeline List */}
      <div className="medios-card" style={{ padding: '24px 20px', position: 'relative' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 12px', color: '#64748b' }}>
            <History size={36} color="#cbd5e1" style={{ margin: '0 auto 10px auto' }} />
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No events found matching your search</p>
            <button
              className="btn-secondary"
              style={{ marginTop: '12px', fontSize: '0.76rem' }}
              onClick={() => { setSelectedFilter('All Events'); setSearchQuery(''); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredEvents.map((event, index) => {
              const isExpanded = !!expandedIds[event.id];
              const isLast = index === filteredEvents.length - 1;

              return (
                <div key={event.id} style={{ display: 'flex', alignItems: 'stretch', gap: '16px', position: 'relative' }}>
                  {/* Left Date / Time Stamp */}
                  <div style={{ width: '110px', textAlign: 'right', flexShrink: 0, paddingTop: '8px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{event.date}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '2px' }}>
                      <Clock size={11} />
                      <span>{event.time}</span>
                    </div>
                  </div>

                  {/* Center Node Icon & Integrated Spine Connector */}
                  <div style={{ width: '42px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {/* Circle Node Badge */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: `2.5px solid ${event.badgeColor || '#2563eb'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                      }}
                    >
                      {getCategoryIcon(event.category)}
                    </div>

                    {/* Vertical Connector Spine Line to Next Node */}
                    {!isLast && (
                      <div
                        style={{
                          width: '2px',
                          flex: 1,
                          minHeight: '28px',
                          backgroundColor: '#e2e8f0',
                          marginTop: '4px',
                          marginBottom: '4px'
                        }}
                      />
                    )}
                  </div>

                  {/* Right Event Card */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      marginBottom: isLast ? 0 : '18px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: `${event.badgeColor}15` || '#eff6ff',
                              color: event.badgeColor || '#2563eb'
                            }}
                          >
                            {event.category}
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                            {event.title}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px' }}>
                          {event.subtitle}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className={`status-pill ${event.status === 'Completed' ? 'completed' : event.status === 'In Progress' ? 'waiting' : 'normal'}`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {event.status}
                        </span>
                        <button
                          onClick={() => toggleExpand(event.id)}
                          style={{
                            background: 'none',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '4px 6px',
                            cursor: 'pointer',
                            color: '#64748b'
                          }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Metadata Sub-row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.74rem', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                      <span>Attending: <strong>{event.doctor}</strong></span>
                      <span>•</span>
                      <span>Department: <strong>{event.department}</strong></span>
                    </div>

                    {/* Collapsible Detailed Content */}
                    {isExpanded && event.details && (
                      <div style={{ marginTop: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0', fontSize: '0.76rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {event.details.diagnosis && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <strong style={{ minWidth: '80px', color: '#0f172a' }}>Diagnosis:</strong>
                            <span style={{ color: '#1e40af', fontWeight: 600 }}>{event.details.diagnosis}</span>
                          </div>
                        )}
                        {event.details.vitalsSummary && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <strong style={{ minWidth: '80px', color: '#0f172a' }}>Vitals:</strong>
                            <span>{event.details.vitalsSummary}</span>
                          </div>
                        )}
                        {event.details.notes && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <strong style={{ minWidth: '80px', color: '#0f172a' }}>Notes:</strong>
                            <span style={{ lineHeight: 1.45 }}>{event.details.notes}</span>
                          </div>
                        )}
                        {event.details.testsConducted && (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <strong style={{ minWidth: '80px', color: '#0f172a' }}>Tests Done:</strong>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {event.details.testsConducted.map((t, idx) => (
                                <span key={idx} style={{ background: '#ffffff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.72rem' }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick Jump Action Button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                          {event.category === 'Consultation' && (
                            <button
                              className="btn-secondary"
                              style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#2563eb' }}
                              onClick={() => setActiveScreen('consultation')}
                            >
                              Go to Consultation
                            </button>
                          )}
                          {event.category === 'Lab' && (
                            <button
                              className="btn-secondary"
                              style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#2563eb' }}
                              onClick={() => setActiveScreen('lab-reports')}
                            >
                              View Full Lab Report
                            </button>
                          )}
                          {event.category === 'Imaging' && (
                            <button
                              className="btn-secondary"
                              style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#2563eb' }}
                              onClick={() => setActiveScreen('imaging')}
                            >
                              View DICOM Images
                            </button>
                          )}
                          {event.category === 'Prescription' && (
                            <button
                              className="btn-secondary"
                              style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#2563eb' }}
                              onClick={() => setActiveScreen('prescriptions')}
                            >
                              View Prescription
                            </button>
                          )}
                          {event.category === 'Vitals' && (
                            <button
                              className="btn-secondary"
                              style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#2563eb' }}
                              onClick={() => setActiveScreen('vitals')}
                            >
                              Open Vitals Dashboard
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Milestone Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Record Clinical Milestone</h3>
              <button onClick={() => setIsAddModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddMilestone}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Follow-up after blood pressure stabilization"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#f8fafc' }}
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Lab">Lab Investigation</option>
                    <option value="Imaging">Imaging / Radiology</option>
                    <option value="Prescription">Prescription / Medication</option>
                    <option value="Vitals">Vitals Check</option>
                    <option value="Emergency">Emergency Encounter</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Clinical Notes & Summary
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Document clinical observations, diagnosis, or recommendations..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
