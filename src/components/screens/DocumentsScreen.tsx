import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientBanner } from '../layout/PatientBanner';
import { mockClinicalDocuments } from '../../mock/documentsData';
import { ClinicalDocument } from '../../types';
import {
  FileCode,
  Search,
  Filter,
  FileText,
  FileCheck,
  Download,
  Printer,
  Share2,
  Eye,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FolderOpen,
  Upload,
  Calendar,
  Sparkles
} from 'lucide-react';

export const DocumentsScreen: React.FC = () => {
  const { activePatient, showToast } = useApp();
  const [documents, setDocuments] = useState<ClinicalDocument[]>(mockClinicalDocuments);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<ClinicalDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<ClinicalDocument['category']>('Discharge Summary');
  const [uploadAuthor, setUploadAuthor] = useState('Dr. Shajin');
  const [uploadNotes, setUploadNotes] = useState('');

  if (!activePatient) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3>No active patient selected</h3>
      </div>
    );
  }

  const categoryTabs = [
    'All Documents',
    'Discharge Summary',
    'Consent Form',
    'Referral Letter',
    'Insurance & Claims',
    'Lab / Diagnostic',
    'Medical Certificate'
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCategory === 'All Documents') return true;
    return doc.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      showToast('Please provide a document title', 'warning');
      return;
    }

    const newDoc: ClinicalDocument = {
      id: `doc-${Date.now()}`,
      uhid: activePatient.uhid,
      title: uploadTitle,
      category: uploadCategory,
      date: '26 Sep 2026',
      author: uploadAuthor,
      department: 'General Medicine',
      fileType: 'pdf',
      fileSize: '1.1 MB',
      status: 'Signed',
      description: uploadNotes || 'Clinician-uploaded medical document.'
    };

    setDocuments([newDoc, ...documents]);
    setIsUploadModalOpen(false);
    setUploadTitle('');
    setUploadNotes('');
    showToast(`Document "${uploadTitle}" uploaded and indexed successfully`);
  };

  return (
    <div className="page-scroll-body">
      {/* Patient Workstation Banner with Subtabs */}
      <PatientBanner currentSubtab="documents" />

      {/* Screen Title & Top Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={20} color="#2563eb" />
            <span>Patient Documents & Clinical Records</span>
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
            Secure repository for discharge summaries, consent forms, referrals, insurance pre-authorizations & external medical scans
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.76rem', padding: '6px 12px' }}
            onClick={() => showToast('All signed patient documents packaged for download (ZIP)')}
          >
            <Download size={14} />
            <span>Download All (ZIP)</span>
          </button>
          <button
            className="btn-primary"
            style={{ fontSize: '0.76rem', padding: '6px 14px' }}
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload size={14} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="medios-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderOpen size={18} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Documents</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{documents.length} Files</div>
          </div>
        </div>

        <div className="medios-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={18} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Digitally Signed</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
              {documents.filter(d => d.status === 'Signed').length} Verified
            </div>
          </div>
        </div>

        <div className="medios-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} color="#d97706" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Pending Signatures</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d97706' }}>
              {documents.filter(d => d.status === 'Pending Signature').length} Pending
            </div>
          </div>
        </div>

        <div className="medios-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#7c3aed" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Insurance & TPA</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7c3aed' }}>Star Health Approved</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categoryTabs.map((tab) => {
            const isSelected = selectedCategory === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedCategory(tab)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.76rem',
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

        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={14} className="search-icon-left" />
          <input
            type="text"
            className="global-search-input"
            style={{ width: '100%', height: '34px', fontSize: '0.78rem' }}
            placeholder="Search document title, doctor, dept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Documents Grid / Cards */}
      {filteredDocuments.length === 0 ? (
        <div className="medios-card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <FolderOpen size={40} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>No documents found</h4>
          <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>Try switching category or resetting your search query</p>
          <button
            className="btn-secondary"
            style={{ marginTop: '12px', fontSize: '0.76rem' }}
            onClick={() => { setSelectedCategory('All Documents'); setSearchQuery(''); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="medios-card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    flexShrink: 0
                  }}
                >
                  PDF
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {doc.category}
                    </span>
                    <span
                      className={`status-pill ${doc.status === 'Signed' ? 'completed' : 'waiting'}`}
                      style={{ fontSize: '0.64rem' }}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                    {doc.title}
                  </h4>
                </div>
              </div>

              {doc.description && (
                <p style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45, margin: 0 }}>
                  {doc.description}
                </p>
              )}

              {/* Document Meta Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.72rem',
                  color: '#64748b',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '8px'
                }}
              >
                <span>{doc.date}</span>
                <span>•</span>
                <span>{doc.fileSize}</span>
                <span>•</span>
                <span>{doc.author}</span>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, fontSize: '0.74rem', padding: '6px 10px', justifyContent: 'center' }}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <Eye size={13} />
                  <span>Preview</span>
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '6px 10px' }}
                  title="Download Document"
                  onClick={() => showToast(`Downloaded ${doc.title}`)}
                >
                  <Download size={13} />
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '6px 10px' }}
                  title="Print Document"
                  onClick={() => window.print()}
                >
                  <Printer size={13} />
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '6px 10px' }}
                  title="Share Document via Secure Portal"
                  onClick={() => showToast(`Secure link copied for ${doc.title}`)}
                >
                  <Share2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '640px', width: '90%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#2563eb" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedDoc.title}</h3>
              </div>
              <button onClick={() => setSelectedDoc(null)}>×</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.76rem', color: '#475569' }}>
                  Category: <strong>{selectedDoc.category}</strong> • Date: <strong>{selectedDoc.date}</strong>
                </div>
                <span className={`status-pill ${selectedDoc.status === 'Signed' ? 'completed' : 'waiting'}`} style={{ fontSize: '0.7rem' }}>
                  {selectedDoc.status}
                </span>
              </div>

              {/* Mock PDF Visual Preview Frame */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '24px',
                  minHeight: '260px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e3a8a', fontWeight: 800 }}>MEDIOS MEMORIAL HOSPITAL</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#64748b' }}>Department of {selectedDoc.department} • NABH Accredited</p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#334155' }}>
                    <div>UHID: <strong>{activePatient.uhid}</strong></div>
                    <div>Patient: <strong>{activePatient.name}</strong> ({activePatient.age}y/{activePatient.gender})</div>
                  </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#0f172a', marginBottom: '6px' }}>{selectedDoc.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.55 }}>
                    {selectedDoc.description}
                  </p>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px dashed #cbd5e1', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    <div>Ref ID: {selectedDoc.id}</div>
                    <div>Digital Hash: 8f9a2b4c1e0d37e6</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} />
                      <span>Digitally Authenticated</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>{selectedDoc.author}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.76rem' }}
                onClick={() => { window.print(); }}
              >
                <Printer size={14} />
                <span>Print Document</span>
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.76rem' }}
                  onClick={() => setSelectedDoc(null)}
                >
                  Close
                </button>
                <button
                  className="btn-primary"
                  style={{ fontSize: '0.76rem' }}
                  onClick={() => { showToast(`Downloaded ${selectedDoc.title}`); setSelectedDoc(null); }}
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Upload Clinical Document</h3>
              <button onClick={() => setIsUploadModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Echo Doppler Report / Surgery Consent Form"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Category
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as any)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#f8fafc' }}
                    >
                      <option value="Discharge Summary">Discharge Summary</option>
                      <option value="Consent Form">Consent Form</option>
                      <option value="Referral Letter">Referral Letter</option>
                      <option value="Insurance & Claims">Insurance & Claims</option>
                      <option value="Lab / Diagnostic">Lab / Diagnostic</option>
                      <option value="Medical Certificate">Medical Certificate</option>
                      <option value="Prescription / Bill">Prescription / Bill</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Author / Doctor
                    </label>
                    <input
                      type="text"
                      value={uploadAuthor}
                      onChange={(e) => setUploadAuthor(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Attach File (PDF, DOCX, DICOM)
                  </label>
                  <div
                    style={{
                      border: '2px dashed #93c5fd',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center',
                      background: '#eff6ff',
                      cursor: 'pointer'
                    }}
                    onClick={() => showToast('File attached: clinical_scan_report.pdf (1.2 MB)')}
                  >
                    <Upload size={24} color="#2563eb" style={{ margin: '0 auto 8px auto' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e40af' }}>
                      Click to choose or drag & drop file here
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                      Supports PDF, JPG, PNG, DICOM up to 50 MB
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Description & Clinical Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter document context, findings, or notes..."
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Upload & Sign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
