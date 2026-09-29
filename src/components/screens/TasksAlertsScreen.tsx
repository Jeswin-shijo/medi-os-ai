import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mockTasksAlerts, mockCriticalAlerts, mockAITaskSuggestions } from '../../mock/tasksAlertsData';
import { TaskAlertItem } from '../../types';
import {
  BellRing,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FlaskConical,
  ImageIcon,
  Eye,
  Phone,
  FileCheck,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

export const TasksAlertsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [tasks, setTasks] = useState<TaskAlertItem[]>(mockTasksAlerts);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState(mockAITaskSuggestions);

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t))
    );
    showToast('Task status updated');
  };

  const toggleSuggestion = (id: string) => {
    setSuggestions(prev =>
      prev.map(s => (s.id === id ? { ...s, checked: !s.checked } : s))
    );
  };

  const filteredTasks = tasks.filter(t => {
    const matches = t.title.toLowerCase().includes(search.toLowerCase()) || t.patientName.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'All') return matches;
    if (activeTab === 'Critical') return matches && t.priority === 'High';
    if (activeTab === 'Follow-ups') return matches && t.type === 'Follow-up';
    if (activeTab === 'Lab Alerts') return matches && t.type === 'Lab Alert';
    if (activeTab === 'Imaging Alerts') return matches && t.type === 'Imaging Alert';
    if (activeTab === 'Medication Alerts') return matches && (t.type === 'Medication' || t.type === 'Medication Alert');
    return matches;
  });

  return (
    <div className="page-scroll-body">
      {/* Screen Header */}
      <div className="screen-header-row">
        <div className="screen-title-area">
          <h1>Tasks & Alerts</h1>
          <p>Stay on top of your clinical tasks, patient follow-ups and important alerts</p>
        </div>
        <div className="screen-header-actions">
          <button className="btn-secondary">
            <Filter size={14} />
            <span>Filters</span>
          </button>
          <button className="btn-secondary">
            <Calendar size={14} />
            <span>Today</span>
          </button>
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.74rem', borderRadius: 0 }}>List</button>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.74rem', borderRadius: 0, border: 'none' }}>Board</button>
          </div>
          <button className="btn-primary" onClick={() => showToast('Create new task form opened')}>
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
        {[
          'All',
          'My Tasks',
          'Follow-ups',
          'Lab Alerts',
          'Imaging Alerts',
          'Medication Alerts',
          'System Alerts'
        ].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: activeTab === tab ? '#2563eb' : 'transparent',
              color: activeTab === tab ? '#ffffff' : '#64748b',
              borderRadius: '6px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 5 Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        <div className="stat-card-item">
          <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-data-box">
            <span className="stat-number">12</span>
            <span className="stat-label">Pending Tasks</span>
            <span className="stat-sub">6 high priority</span>
          </div>
        </div>

        <div className="stat-card-item">
          <div className="stat-icon-wrapper" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-data-box">
            <span className="stat-number" style={{ color: '#dc2626' }}>4</span>
            <span className="stat-label">Critical Alerts</span>
            <span className="stat-sub">Requires attention</span>
          </div>
        </div>

        <div className="stat-card-item">
          <div className="stat-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={20} />
          </div>
          <div className="stat-data-box">
            <span className="stat-number">8</span>
            <span className="stat-label">Follow-ups Due</span>
            <span className="stat-sub">Today</span>
          </div>
        </div>

        <div className="stat-card-item">
          <div className="stat-icon-wrapper" style={{ background: '#ecfeff', color: '#0891b2' }}>
            <FlaskConical size={20} />
          </div>
          <div className="stat-data-box">
            <span className="stat-number">6</span>
            <span className="stat-label">Lab Results Pending</span>
            <span className="stat-sub">Review reports</span>
          </div>
        </div>

        <div className="stat-card-item">
          <div className="stat-icon-wrapper" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <ImageIcon size={20} />
          </div>
          <div className="stat-data-box">
            <span className="stat-number">2</span>
            <span className="stat-label">Imaging Results</span>
            <span className="stat-sub">Unread reports</span>
          </div>
        </div>
      </div>

      {/* 2-Column Main Layout: Task Table | Right Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px' }}>
        {/* Left Column: Tasks Table */}
        <div className="medios-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Tasks & Alerts ({tasks.length})</span>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} className="search-icon-left" />
              <input
                type="text"
                className="global-search-input"
                style={{ width: '100%', height: '32px', fontSize: '0.76rem' }}
                placeholder="Search tasks, patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <table className="medios-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: '20px' }}>
                  <input type="checkbox" />
                </th>
                <th>Task / Alert</th>
                <th>Patient</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Due Date / Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const isDone = task.status === 'Completed';
                return (
                  <tr key={task.id} style={{ opacity: isDone ? 0.6 : 1 }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleTask(task.id)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {task.priority === 'High' ? (
                          <AlertTriangle size={15} color="#ef4444" />
                        ) : (
                          <Clock size={15} color="#64748b" />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{task.title}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{task.subtitle}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{task.patientName}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{task.uhid}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', fontWeight: 600 }}>
                        {task.type}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background:
                            task.priority === 'High' ? '#fee2e2' : task.priority === 'Medium' ? '#fef3c7' : '#ecfdf5',
                          color:
                            task.priority === 'High' ? '#dc2626' : task.priority === 'Medium' ? '#d97706' : '#059669',
                          fontWeight: 700
                        }}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.74rem', color: '#475569' }}>{task.dueDateTime}</td>
                    <td>
                      <span className={`status-pill ${task.status === 'Completed' ? 'completed' : task.status === 'In Progress' ? 'in-consultation' : 'waiting'}`} style={{ fontSize: '0.66rem' }}>
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={{ color: '#2563eb' }} onClick={() => showToast(`Viewing task: ${task.title}`)}><Eye size={13} /></button>
                        <button style={{ color: '#64748b' }}><Phone size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Column: AI Suggestions, Critical Alerts, Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* AI Task Suggestions Card */}
          <div className="ai-assistant-card">
            <div className="ai-header-bar">
              <div className="ai-title-row">
                <Sparkles size={16} />
                <span>AI Task Suggestions (GPT-6 Astro)</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suggestions.map((s) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={s.checked}
                    onChange={() => toggleSuggestion(s.id)}
                  />
                  <span>{s.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Critical Alerts Card */}
          <div className="medios-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 800, fontSize: '0.84rem' }}>
                <AlertTriangle size={16} />
                <span>Critical Alerts (4)</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer' }}>View All</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {mockCriticalAlerts.map(ca => (
                <div key={ca.id} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#991b1b' }}>{ca.title}</div>
                    <div style={{ fontSize: '0.68rem', color: '#b91c1c' }}>{ca.patient} • {ca.time}</div>
                  </div>
                  <span style={{ fontSize: '0.66rem', padding: '1px 6px', borderRadius: '4px', background: '#ffffff', color: '#dc2626', fontWeight: 700 }}>
                    {ca.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="medios-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Quick Actions</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Create Task')}>
                + Create Task
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Set Reminder')}>
                ⏰ Set Reminder
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Assign Task')}>
                👤 Assign Task
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'center' }} onClick={() => showToast('Marked all completed')}>
                ✓ Mark Complete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
