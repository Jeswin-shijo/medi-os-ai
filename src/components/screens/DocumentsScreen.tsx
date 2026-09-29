import React, { useState } from 'react';
import { useApp } from '../../context/appContextCore';
import { PatientBanner } from '../layout/PatientBanner';
import { ScreenHeader } from '../common/ScreenHeader';
import { AiSparkle } from '../common/icons';
import { mockClinicalDocuments } from '../../mock/documentsData';
import { ClinicalDocument } from '../../types';
import {
  Files,
  Search,
  FileText,
  Download,
  Printer,
  Share2,
  Eye,
  CircleCheck,
  ShieldCheck,
  Upload,
  PenLine,
  RefreshCw,
  X
} from 'lucide-react';

type Category = ClinicalDocument['category'];
type Tone = 'blue' | 'green' | 'orange' | 'purple';

const TONES: Record<Tone, { fg: string; bg: string }> = {
  blue: { fg: 'var(--blue-text)', bg: 'var(--blue-light)' },
  green: { fg: 'var(--green-dark)', bg: 'var(--green-light)' },
  orange: { fg: 'var(--orange-dark)', bg: 'var(--orange-light)' },
  purple: { fg: 'var(--purple-dark)', bg: 'var(--purple-light)' }
};

const CATEGORY_TABS: ('All Documents' | Category)[] = [
  'All Documents',
  'Discharge Summary',
  'Consent Form',
  'Referral Letter',
  'Insurance & Claims',
  'Lab / Diagnostic',
  'Medical Certificate',
  'Prescription / Bill'
];

const SHORT_LABEL: Record<string, string> = {
  'All Documents': 'All',
  'Discharge Summary': 'Discharge',
  'Consent Form': 'Consent',
  'Referral Letter': 'Referral',
  'Insurance & Claims': 'Insurance',
  'Lab / Diagnostic': 'Lab / Diagnostic',
  'Medical Certificate': 'Certificates',
  'Prescription / Bill': 'Prescription / Bill'
};

const STATUS_PILL: Record<ClinicalDocument['status'], string> = {
  Signed: 'completed',
  'Pending Signature': 'pending',
  Draft: 'scheduled',
  Archived: 'gray'
};

const KEY_DOCUMENTS = [
  'ER discharge (10 Jan) – non-cardiac chest pain',
  'Echo Doppler (02 Feb) – LVEF 62%, normal LV function',
  'Cardiology referral (12 Sep) – TMT pending',
  'Lab cumulative report (Sep) – HbA1c 7.8% high'
];

const FileBadge: React.FC<{ type: ClinicalDocument['fileType'] }> = ({ type }) => (
  <span
    style={{
      width: '30px',
      height: '30px',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: 'var(--red-light)',
      color: 'var(--red-dark)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 700,
      flexShrink: 0,
      textTransform: 'uppercase'
    }}
  >
    {type}
  </span>
);

export const DocumentsScreen: React.FC = () => {
  const { activePatient, showToast } = useApp();
  const [documents, setDocuments] = useState<ClinicalDocument[]>(mockClinicalDocuments);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<ClinicalDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<Category>('Discharge Summary');
  const [uploadAuthor, setUploadAuthor] = useState('Dr. Shajin');
  const [uploadNotes, setUploadNotes] = useState('');

  if (!activePatient) {
    return (
      <div className="page-scroll-body">
        <div className="medios-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
          <h3 className="card-title">No active patient selected</h3>
        </div>
      </div>
    );
  }

  const query = searchQuery.toLowerCase();
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(query) ||
      doc.author.toLowerCase().includes(query) ||
      doc.department.toLowerCase().includes(query) ||
      (doc.description && doc.description.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (selectedCategory === 'All Documents') return true;
    return doc.category === selectedCategory;
  });

  const countOf = (tab: string) =>
    tab === 'All Documents' ? documents.length : documents.filter(d => d.category === tab).length;
  const signedCount = documents.filter(d => d.status === 'Signed').length;
  const pendingDocs = documents.filter(d => d.status === 'Pending Signature');
  const insurance = activePatient.insurance;

  const summaryTiles: { label: string; value: string; sub: string; tone: Tone }[] = [
    { label: 'Total Documents', value: String(documents.length), sub: 'Files on record', tone: 'blue' },
    { label: 'Digitally Signed', value: String(signedCount), sub: 'Verified', tone: 'green' },
    { label: 'Pending Signatures', value: String(pendingDocs.length), sub: 'Awaiting sign-off', tone: 'orange' },
    { label: 'Insurance & TPA', value: 'Approved', sub: insurance?.provider ?? 'Star Health', tone: 'purple' }
  ];

  const handleSign = (doc: ClinicalDocument) => {
    setDocuments(prev => prev.map(d => (d.id === doc.id ? { ...d, status: 'Signed' } : d)));
    showToast(`"${doc.title}" digitally signed`);
  };

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

  const rowAction = (title: string, icon: React.ReactNode, onClick: () => void) => (
    <button
      className="icon-btn"
      style={{ width: '28px', height: '28px' }}
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {icon}
    </button>
  );

  return (
    <div className="page-scroll-body">
      <ScreenHeader
        title="Documents"
        subtitle="Discharge summaries, consent forms, referrals, insurance and scanned medical records"
        actions={
          <>
            <button className="btn-secondary" onClick={() => showToast('All signed patient documents packaged for download (ZIP)')}>
              <Download size={18} />
              <span>Download All (ZIP)</span>
            </button>
            <button className="btn-primary" onClick={() => setIsUploadModalOpen(true)}>
              <Upload size={18} />
              <span>Upload Document</span>
            </button>
          </>
        }
      />

      <PatientBanner activeTab="documents" />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) clamp(300px, 26vw, 372px)', gap: 'var(--gap)', alignItems: 'start' }}>
        {/* Document list */}
        <div className="medios-card" style={{ minWidth: 0 }}>
          <div className="card-header-row" style={{ marginBottom: '10px' }}>
            <div className="card-title-group">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Files size={18} color="var(--blue-text)" />
                <span>Patient Documents</span>
              </h3>
              <p>
                {filteredDocuments.length} of {documents.length} documents · {selectedCategory}
              </p>
            </div>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                className="input-field"
                style={{ height: '32px', paddingLeft: '32px', fontSize: 'var(--fs-sm)' }}
                placeholder="Search title, doctor, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                className={`chip-btn ${selectedCategory === tab ? 'active' : ''}`}
                onClick={() => setSelectedCategory(tab)}
              >
                {SHORT_LABEL[tab]} ({countOf(tab)})
              </button>
            ))}
          </div>

          {filteredDocuments.length === 0 ? (
            <div style={{ padding: '40px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Files size={32} color="var(--border-strong)" style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ fontSize: 'var(--fs-h4)', fontWeight: 600, color: 'var(--text-primary)' }}>No documents found</h4>
              <p style={{ fontSize: 'var(--fs-sm)', marginTop: '4px' }}>Try switching category or resetting your search query</p>
              <button
                className="btn-secondary btn-sm"
                style={{ marginTop: '12px' }}
                onClick={() => { setSelectedCategory('All Documents'); setSearchQuery(''); }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="medios-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Date</th>
                    <th>Author</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDoc(doc)}>
                      <td style={{ width: '46%', maxWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} title={doc.title}>
                          <FileBadge type={doc.fileType} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.title}
                            </div>
                            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.category} · {doc.fileSize}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{doc.date}</td>
                      <td style={{ maxWidth: 0, width: '22%' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.author}</div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.department}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${STATUS_PILL[doc.status]}`}>{doc.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                          {rowAction('Preview', <Eye size={14} />, () => setSelectedDoc(doc))}
                          {rowAction('Download Document', <Download size={14} />, () => showToast(`Downloaded ${doc.title}`))}
                          {rowAction('Print Document', <Printer size={14} />, () => window.print())}
                          {rowAction('Share via Secure Portal', <Share2 size={14} />, () => showToast(`Secure link copied for ${doc.title}`))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)', position: 'sticky', top: 0 }}>
          <div className="medios-card">
            <div className="card-header-row">
              <h3 className="card-title">Document Summary</h3>
              <button className="text-link" onClick={() => setSelectedCategory('All Documents')}>View All</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              {summaryTiles.map((tile) => (
                <div
                  key={tile.label}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: TONES[tile.tone].bg,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                  }}
                >
                  <span style={{ fontSize: 'var(--fs-stat)', fontWeight: 700, color: TONES[tile.tone].fg, lineHeight: 1.15 }}>{tile.value}</span>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{tile.label}</span>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{tile.sub}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-assistant-card">
            <div className="ai-header-bar">
              <div className="ai-title-row">
                <AiSparkle size={20} />
                <span>AI Records Summary (GPT-6 Astro)</span>
              </div>
              <button className="icon-btn" style={{ width: '28px', height: '28px' }} title="Regenerate" onClick={() => showToast('AI record summary regenerated', 'info')}>
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="ai-section">
              <div className="ai-section-title">
                <AiSparkle size={12} />
                <span>Pending Actions</span>
              </div>
              {pendingDocs.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-sm)' }}>
                  <CircleCheck size={14} color="#ffffff" fill="var(--green-emerald)" />
                  <span>All documents are digitally signed.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pendingDocs.map((doc) => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ minWidth: 0, fontSize: 'var(--fs-sm)' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doc.title}</div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Awaiting signature · {doc.author}</div>
                      </div>
                      <button className="btn-primary btn-sm" onClick={() => handleSign(doc)}>
                        <PenLine size={13} />
                        <span>Sign</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ai-section">
              <div className="ai-section-title">
                <AiSparkle size={12} />
                <span>Key Documents</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {KEY_DOCUMENTS.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>

            {insurance && (
              <div className="ai-section">
                <div className="ai-section-title">
                  <ShieldCheck size={13} />
                  <span>Insurance & TPA</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr)', rowGap: '3px', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Provider</span>
                  <span>{insurance.provider} · {insurance.policyNumber}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Validity</span>
                  <span>{insurance.validity}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Pre-auth</span>
                  <span><span className="status-pill completed">Cashless Approved</span></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="modal-backdrop" onClick={() => setSelectedDoc(null)}>
          <div className="modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <FileText size={18} color="var(--blue-text)" style={{ flexShrink: 0 }} />
                <span>{selectedDoc.title}</span>
              </h3>
              <button className="icon-btn" title="Close" onClick={() => setSelectedDoc(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 'var(--fs-sm)',
                  color: 'var(--text-secondary)'
                }}
              >
                <span>
                  Category: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedDoc.category}</strong>
                  {' · '}Date: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedDoc.date}</strong>
                  {' · '}{selectedDoc.fileSize}
                </span>
                <span className={`status-pill ${STATUS_PILL[selectedDoc.status]}`}>{selectedDoc.status}</span>
              </div>

              {/* Mock PDF preview */}
              <div
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '22px 24px',
                  minHeight: '260px',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderBottom: '2px solid var(--text-primary)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/logo.svg" alt="" width={32} height={32} />
                    <div>
                      <div style={{ fontSize: 'var(--fs-h3)', fontWeight: 700, color: 'var(--text-primary)' }}>MediOS Memorial Hospital</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Department of {selectedDoc.department} · NABH Accredited</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                    <div>UHID: <strong style={{ color: 'var(--text-primary)' }}>{activePatient.uhid}</strong></div>
                    <div>
                      Patient: <strong style={{ color: 'var(--text-primary)' }}>{activePatient.name}</strong> ({activePatient.age}y / {activePatient.gender})
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 'var(--fs-h4)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{selectedDoc.title}</h4>
                  <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{selectedDoc.description}</p>
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    borderTop: '1px dashed var(--border-strong)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                  }}
                >
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    <div>Ref ID: {selectedDoc.id}</div>
                    <div>Digital Hash: <span style={{ fontFamily: 'var(--font-mono)' }}>8f9a2b4c1e0d37e6</span></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {selectedDoc.status === 'Signed' ? (
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--green-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <CircleCheck size={12} />
                        <span>Digitally Authenticated</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--orange-dark)', fontWeight: 600 }}>Signature Pending</div>
                    )}
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDoc.author}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="btn-secondary" onClick={() => window.print()}>
                <Printer size={15} />
                <span>Print Document</span>
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => setSelectedDoc(null)}>
                  Close
                </button>
                <button
                  className="btn-primary"
                  onClick={() => { showToast(`Downloaded ${selectedDoc.title}`); setSelectedDoc(null); }}
                >
                  <Download size={15} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsUploadModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} color="var(--blue-text)" />
                <span>Upload Clinical Document</span>
              </h3>
              <button className="icon-btn" title="Close" onClick={() => setIsUploadModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                <div>
                  <label className="form-label" htmlFor="doc-title">Document Title *</label>
                  <input
                    id="doc-title"
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Echo Doppler Report / Surgery Consent Form"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" htmlFor="doc-category">Category</label>
                    <select
                      id="doc-category"
                      className="form-select"
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as Category)}
                    >
                      {CATEGORY_TABS.filter((t): t is Category => t !== 'All Documents').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" htmlFor="doc-author">Author / Doctor</label>
                    <input
                      id="doc-author"
                      type="text"
                      className="input-field"
                      value={uploadAuthor}
                      onChange={(e) => setUploadAuthor(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <span className="form-label">Attach File (PDF, DOCX, DICOM)</span>
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      border: '1.5px dashed var(--blue-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '18px',
                      textAlign: 'center',
                      backgroundColor: 'var(--blue-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onClick={() => showToast('File attached: clinical_scan_report.pdf (1.2 MB)')}
                  >
                    <Upload size={22} color="var(--blue-text)" />
                    <span style={{ fontSize: 'var(--fs-body)', fontWeight: 500, color: 'var(--blue-text)' }}>
                      Click to choose or drag & drop file here
                    </span>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                      Supports PDF, JPG, PNG, DICOM up to 50 MB
                    </span>
                  </button>
                </div>

                <div>
                  <label className="form-label" htmlFor="doc-notes">Description & Clinical Notes</label>
                  <textarea
                    id="doc-notes"
                    rows={3}
                    className="input-field"
                    placeholder="Enter document context, findings, or notes..."
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
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
