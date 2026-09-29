import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';
import { appointmentService } from '../../services';
import {
  CalendarDays,
  Plus,
  Clock,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Phone,
  Eye,
  MoreVertical,
  Heart,
  Activity,
  AlertTriangle,
  FolderOpen,
  FileSignature,
  Edit2,
  Settings,
  X
} from 'lucide-react';

export const AppointmentsScreen: React.FC = () => {
  const { setActiveScreen, setActivePatient, showToast } = useApp();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAptId, setSelectedAptId] = useState<string>('apt-1');
  const [viewTab, setViewTab] = useState('Daily View');
  const [isAddAptModalOpen, setIsAddAptModalOpen] = useState(false);

  // Add Appointment State
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [time, setTime] = useState('11:00 AM');
  const [type, setType] = useState('Follow-up');
  const [condition, setCondition] = useState('');

  useEffect(() => {
    appointmentService.getAppointments().then(setAppointments);
  }, []);

  const selectedApt = appointments.find(a => a.id === selectedAptId) || appointments[0];

  const displayedAppointments = appointments.filter((apt) => {
    if (viewTab === 'Follow-ups') return apt.type === 'Follow-up';
    if (viewTab === 'Waiting List') return apt.status === 'Waiting';
    if (viewTab === 'Canceled / No Show') return apt.status === 'Canceled';
    if (viewTab === 'Teleconsultation') return apt.type === 'Teleconsultation' || (apt.notes && apt.notes.toLowerCase().includes('tele'));
    return true;
  });

  const handleUpdateStatus = async (id: string, newStatus: Appointment['status']) => {
    await appointmentService.updateStatus(id, newStatus);
    const updated = await appointmentService.getAppointments();
    setAppointments(updated);
    showToast(`Appointment status updated to ${newStatus}`);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName) return;

    const newApt = await appointmentService.addAppointment({
      uhid: `MHK202500${Math.floor(100 + Math.random() * 900)}`,
      patientName,
      age: parseInt(age) || 30,
      gender: 'Male',
      phone: '+91 98765 00000',
      time,
      date: '2026-09-26',
      type,
      condition: condition || 'General Consultation',
      status: 'Scheduled',
      notes: 'Scheduled via appointment portal'
    });

    const refreshed = await appointmentService.getAppointments();
    setAppointments(refreshed);
    setSelectedAptId(newApt.id);
    setIsAddAptModalOpen(false);
    showToast(`Appointment created for ${patientName} at ${time}!`);
  };

  return (
    <div className="page-scroll-body">
      {/* Header */}
      <div className="screen-header-row">
        <div className="screen-title-area">
          <h1>Appointments</h1>
          <p>Manage your appointments, schedule and follow-ups</p>
        </div>
        <div className="screen-header-actions">
          <button className="btn-secondary" onClick={() => showToast('Schedule block slot added for 1:00 PM - 2:00 PM')}>
            <Clock size={16} />
            <span>Block Time</span>
          </button>
          <button className="btn-primary" onClick={() => setIsAddAptModalOpen(true)}>
            <Plus size={16} />
            <span>Add Appointment</span>
          </button>
          <button className="btn-secondary" style={{ padding: '8px 10px' }}>
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* View Tabs & Date Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '2px' }}>
          {[
            'Daily View',
            'Calendar View',
            'List View',
            'Follow-ups',
            'Waiting List',
            'Canceled / No Show',
            'Teleconsultation'
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setViewTab(tab)}
              style={{
                padding: '6px 14px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: viewTab === tab ? '#2563eb' : '#64748b',
                borderBottom: viewTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                background: 'none'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn-secondary" style={{ padding: '4px 8px' }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>26 Sep 2026</span>
          <button className="btn-secondary" style={{ padding: '4px 8px' }}>
            <ChevronRight size={14} />
          </button>
          <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.78rem' }}>
            Today
          </button>
        </div>
      </div>

      {/* 3-Column Layout: Left Widgets (Calendar/Filters), Center Timeline List, Right Selected Detail Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 340px', gap: '20px' }}>
        {/* Left Column: Mini Calendar, Doctor Schedule & Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mini Calendar Widget */}
          <div className="medios-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>September 2026</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{ padding: '2px 4px', color: '#64748b' }}><ChevronLeft size={14} /></button>
                <button style={{ padding: '2px 4px', color: '#64748b' }}><ChevronRight size={14} /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.76rem', marginTop: '6px' }}>
              <span style={{ color: '#cbd5e1' }}>30</span>
              <span style={{ color: '#cbd5e1' }}>31</span>
              {[...Array(25)].map((_, i) => (
                <span
                  key={i}
                  style={{
                    padding: '4px 0',
                    borderRadius: '4px',
                    fontWeight: 500,
                    color: '#334155'
                  }}
                >
                  {i + 1}
                </span>
              ))}
              <span
                style={{
                  padding: '4px 0',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700
                }}
              >
                26
              </span>
              {[27, 28, 29, 30].map(day => (
                <span key={day} style={{ padding: '4px 0', color: '#334155' }}>{day}</span>
              ))}
            </div>
          </div>

          {/* Doctor Schedule Widget */}
          <div className="medios-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Doctor Schedule</span>
              <Settings size={14} color="#64748b" style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem' }}>
                <input type="checkbox" defaultChecked />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>General OPD</div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>9:00 AM – 1:00 PM</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem' }}>
                <input type="checkbox" defaultChecked />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>Follow-up</div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>2:00 PM – 4:00 PM</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem' }}>
                <input type="checkbox" defaultChecked />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>Teleconsultation</div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>4:00 PM – 5:00 PM</div>
                </div>
              </label>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="medios-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Filters</span>

            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Appointment Type</label>
              <select style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px', background: '#f8fafc' }}>
                <option>All Types</option>
                <option>OPD Consultation</option>
                <option>Follow-up</option>
                <option>Teleconsultation</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Patient Status</label>
              <select style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px', background: '#f8fafc' }}>
                <option>All</option>
                <option>Checked In</option>
                <option>Waiting</option>
                <option>Scheduled</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Time Slot</label>
              <select style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px', background: '#f8fafc' }}>
                <option>All</option>
                <option>Morning (09:00 - 13:00)</option>
                <option>Afternoon (14:00 - 17:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Center Column: Appointments Timeline List */}
        <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Status Counts Strip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Today, 26 Sep 2026</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{appointments.length} Appointments scheduled</p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '4px 10px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#059669', display: 'block' }}>8</span>
                <span style={{ fontSize: '0.66rem', color: '#047857' }}>Checked In</span>
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#d97706', display: 'block' }}>2</span>
                <span style={{ fontSize: '0.66rem', color: '#b45309' }}>Waiting</span>
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb', display: 'block' }}>1</span>
                <span style={{ fontSize: '0.66rem', color: '#1d4ed8' }}>In Consultation</span>
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '8px', background: '#f5f3ff', border: '1px solid #ddd6fe', textAlign: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#7c3aed', display: 'block' }}>1</span>
                <span style={{ fontSize: '0.66rem', color: '#6d28d9' }}>Completed</span>
              </div>
            </div>
          </div>

          {/* Appointments Queue List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayedAppointments.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontWeight: 600, fontSize: '0.86rem' }}>No appointments found for "{viewTab}"</p>
                <button
                  className="btn-secondary"
                  style={{ marginTop: '8px', fontSize: '0.74rem' }}
                  onClick={() => setViewTab('Daily View')}
                >
                  View All Daily Appointments
                </button>
              </div>
            ) : (
              displayedAppointments.map((apt) => {
              const isSelected = selectedApt?.id === apt.id;
              return (
                <div
                  key={apt.id}
                  onClick={() => setSelectedAptId(apt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Left Time & Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ minWidth: '70px' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{apt.time}</span>
                    </div>

                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                      {apt.patientName.charAt(0)}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{apt.patientName}</h4>
                      </div>
                      <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {apt.age} Yrs • {apt.gender} • {apt.uhid}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 500 }}>
                        {apt.condition}
                      </p>
                    </div>
                  </div>

                  {/* Right Status & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      className={`status-pill ${
                        apt.status === 'Checked In'
                          ? 'checked-in'
                          : apt.status === 'Waiting'
                          ? 'waiting'
                          : apt.status === 'In Consultation'
                          ? 'in-consultation'
                          : apt.status === 'Completed'
                          ? 'completed'
                          : 'scheduled'
                      }`}
                    >
                      {apt.status}
                    </span>

                    {/* Dynamic Action Button matching screenshot */}
                    {apt.status === 'Checked In' && (
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveScreen('consultation');
                        }}
                      >
                        Start Consultation
                      </button>
                    )}

                    {apt.status === 'Waiting' && (
                      <button
                        className="btn-outline-blue"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Calling patient: ${apt.patientName}`);
                        }}
                      >
                        <Phone size={12} />
                        <span>Call Patient</span>
                      </button>
                    )}

                    {apt.status === 'In Consultation' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                          {apt.consultationDuration || '00:12:35'}
                        </span>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveScreen('consultation');
                          }}
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      </div>
                    )}

                    {apt.status === 'Scheduled' && (
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(apt.id, 'Checked In');
                        }}
                      >
                        Check In
                      </button>
                    )}

                    <button className="btn-secondary" style={{ padding: '6px' }} onClick={(e) => e.stopPropagation()}>
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
              );
            }))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginTop: '10px' }}>
            <span>Showing 1 to {appointments.length} of {appointments.length} appointments</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="btn-secondary" style={{ padding: '2px 6px' }}>&lt;</button>
              <button className="btn-primary" style={{ padding: '2px 8px' }}>1</button>
              <button className="btn-secondary" style={{ padding: '2px 6px' }}>&gt;</button>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Patient Quick Info & Appointment Details */}
        {selectedApt && (
          <div className="medios-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Patient Header */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                alt={selectedApt.patientName}
                style={{ width: '46px', height: '46px', borderRadius: '50%', border: '2px solid #3b82f6', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800 }}>
                  {selectedApt.patientName} ♂
                </h4>
                <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {selectedApt.age} Years • {selectedApt.gender}
                </p>
                <p style={{ fontSize: '0.72rem', color: '#64748b' }}>UHID: {selectedApt.uhid}</p>
                <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{selectedApt.phone}</p>
              </div>
              <button className="btn-secondary" style={{ padding: '4px' }}>
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="badge-tag hypertension">
                <Heart size={10} />
                <span>Hypertension</span>
              </span>
              <span className="badge-tag diabetes">
                <Activity size={10} />
                <span>Type 2 Diabetes</span>
              </span>
              <span className="badge-tag allergy">
                <AlertTriangle size={10} />
                <span>Allergy: Penicillin</span>
              </span>
            </div>

            {/* Appointment Details Tab Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '14px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', borderBottom: '2px solid #2563eb', paddingBottom: '6px' }}>
                Appointment Details
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', paddingBottom: '6px', cursor: 'pointer' }}>
                Patient Quick Info
              </span>
            </div>

            {/* Details Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>📅 26 Sep 2026</span>
                <span style={{ fontWeight: 600 }}>🕒 {selectedApt.time}</span>
              </div>
              <div style={{ color: '#334155' }}>🏥 Follow-up (In-person)</div>
              <div style={{ color: '#334155' }}>🩺 Blood pressure review</div>
              <div style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} />
                <span>Checked In – 09:05 AM</span>
              </div>
            </div>

            {/* Note box */}
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', position: 'relative' }}>
              <p style={{ fontSize: '0.76rem', color: '#334155', fontStyle: 'italic', paddingRight: '20px' }}>
                "{selectedApt.notes || 'Patient reported mild headache last week. Bring previous reports.'}"
              </p>
              <Edit2 size={12} color="#64748b" style={{ position: 'absolute', right: '8px', top: '8px', cursor: 'pointer' }} />
            </div>

            {/* Reschedule / Cancel actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '6px' }}>
              <button className="btn-secondary" style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center' }}>
                Reschedule
              </button>
              <button className="btn-secondary" style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center', color: '#dc2626' }}>
                Cancel
              </button>
              <button className="btn-secondary" style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center' }}>
                + Add Note
              </button>
            </div>

            {/* Previous Appointments */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>Previous Appointments</span>
                <span style={{ fontSize: '0.7rem', color: '#2563eb', cursor: 'pointer' }}>View All</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>• 12 Sep 2026 Follow-up</span>
                  <span style={{ color: '#64748b' }}>BP review</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>• 15 Aug 2026 Consultation</span>
                  <span style={{ color: '#64748b' }}>Sugar check</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>• 10 Jun 2026 Consultation</span>
                  <span style={{ color: '#64748b' }}>Routine checkup</span>
                </div>
              </div>
            </div>

            {/* Big Start Consultation Button */}
            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', padding: '10px' }}
              onClick={() => setActiveScreen('consultation')}
            >
              <span>Start Consultation</span>
              <ChevronRight size={16} />
            </button>

            {/* Bottom auxiliary links */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px' }}>
              <button className="btn-secondary" style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center' }} onClick={() => setActiveScreen('emr')}>
                <FolderOpen size={12} />
                <span>Full EMR</span>
              </button>
              <button className="btn-secondary" style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center' }} onClick={() => setActiveScreen('prescriptions')}>
                <FileSignature size={12} />
                <span>Prescribe</span>
              </button>
              <button className="btn-secondary" style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center' }}>
                <span>••• More</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Appointment Modal */}
      {isAddAptModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddAptModalOpen(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Schedule New Appointment</h3>
              <button onClick={() => setIsAddAptModalOpen(false)} style={{ color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment}>
              <div className="modal-body">
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun Kumar"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Time Slot *</label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', background: '#ffffff' }}
                    >
                      <option>09:00 AM</option>
                      <option>09:30 AM</option>
                      <option>10:00 AM</option>
                      <option>10:30 AM</option>
                      <option>11:00 AM</option>
                      <option>11:30 AM</option>
                      <option>02:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Appointment Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', background: '#ffffff' }}
                    >
                      <option>Follow-up</option>
                      <option>General OPD</option>
                      <option>Emergency</option>
                      <option>Teleconsultation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Chief Complaint / Purpose</label>
                  <input
                    type="text"
                    placeholder="e.g. Hypertension follow-up, Fever review"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddAptModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
