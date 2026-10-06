import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Badge, Modal, LoadingSpinner, ConfirmDialog } from '../../components/ui';
import { casesApi } from '../../api';
import toast from 'react-hot-toast';

const PRIORITY_STATUS = {
  critical: 'danger',
  high: 'warning',
  normal: 'info',
  low: 'default',
};

const MOCK_CASE = {
  id: 1,
  case_number: 'CASE-2024-0001',
  member_name: 'Adebayo Okonkwo',
  member_id: 'MEM-001',
  member_phone: '+234 801 234 5678',
  member_email: 'a.okonkwo@email.com',
  case_type: 'complaint',
  subject: 'Claim denied without clear reason — requesting urgent review',
  description: 'The member submitted a claim for outpatient treatment on 25 Jan 2024 at Reddington Hospital. The claim was denied with code "NOT_COVERED" but the treatment falls within the Bronze plan coverage. The member is requesting an urgent review and reimbursement of ₦85,000.',
  priority: 'critical',
  status: 'open',
  assigned_to_name: 'Dr. Sarah Okafor',
  sla_due_date: '2024-03-17',
  created_at: '2024-03-10',
  communications: [
    {
      id: 1,
      sender_type: 'member',
      sender_name: 'Adebayo Okonkwo',
      message: 'I am very upset. My claim was denied without any proper explanation. I need this resolved urgently.',
      created_at: '2024-03-10T10:23:00Z',
    },
    {
      id: 2,
      sender_type: 'staff',
      sender_name: 'Dr. Sarah Okafor',
      message: 'Thank you for reaching out. I have reviewed your case and escalated it to our claims team. We will resolve this within 48 hours.',
      created_at: '2024-03-10T14:45:00Z',
    },
  ],
};

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  // Resolve modal
  const [showResolve, setShowResolve] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // Close confirm
  const [showClose, setShowClose] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchCase = useCallback(async () => {
    setLoading(true);
    try {
      const res = await casesApi.getById(id);
      const data = res.data?.data || res.data;
      setCaseData(data && data.case_number ? data : MOCK_CASE);
    } catch {
      setCaseData(MOCK_CASE);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCase(); }, [fetchCase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [caseData?.communications]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await casesApi.update(id, { message: replyText.trim() });
      toast.success('Reply sent');
      setReplyText('');
      fetchCase();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      toast.error('Resolution notes are required');
      return;
    }
    setResolving(true);
    try {
      await casesApi.resolve(id, { resolution_notes: resolutionNotes });
      toast.success('Case resolved successfully');
      setShowResolve(false);
      setResolutionNotes('');
      fetchCase();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resolve case');
    } finally {
      setResolving(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await casesApi.close(id);
      toast.success('Case closed');
      navigate('/cases');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to close case');
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout>
        <div className="text-center py-16 text-gray-500">Case not found.</div>
      </Layout>
    );
  }

  const canAct = caseData.status !== 'closed' && caseData.status !== 'resolved';

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate('/cases')}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          ← Back to Cases
        </button>

        {/* Header */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{caseData.case_number}</h1>
                <Badge status={PRIORITY_STATUS[caseData.priority] || 'default'}>
                  {caseData.priority} priority
                </Badge>
                <Badge status={caseData.status}>{caseData.status?.replace(/_/g, ' ')}</Badge>
                <Badge status="info">{caseData.case_type?.replace(/_/g, ' ')}</Badge>
              </div>
              <p className="text-gray-700 font-medium">{caseData.subject}</p>
              <p className="text-sm text-gray-500">
                Assigned to: <span className="font-medium text-gray-700">{caseData.assigned_to_name}</span>
                {caseData.sla_due_date && (
                  <span className="ml-4">
                    SLA Due:{' '}
                    <span className="font-medium text-red-600">
                      {new Date(caseData.sla_due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </span>
                )}
              </p>
            </div>
            {canAct && (
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" onClick={() => setShowResolve(true)}>
                  ✓ Resolve
                </Button>
                <Button variant="danger" onClick={() => setShowClose(true)}>
                  Close Case
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Member Info */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-3">Member Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{caseData.member_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Member ID</span>
                <span className="font-mono text-xs">{caseData.member_id}</span>
              </div>
              {caseData.member_phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span>{caseData.member_phone}</span>
                </div>
              )}
              {caseData.member_email && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span>{caseData.member_email}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Case Details */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-3">Case Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="capitalize">{caseData.case_type?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>{new Date(caseData.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {caseData.sla_due_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">SLA Due</span>
                  <span className="text-red-600 font-medium">
                    {new Date(caseData.sla_due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
            {caseData.description && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{caseData.description}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Communications */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Communications</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {(caseData.communications || []).length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">No messages yet.</p>
            )}
            {(caseData.communications || []).map(msg => {
              const isStaff = msg.sender_type === 'staff';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[75%] ${isStaff ? 'ml-auto items-end' : 'items-start'}`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isStaff
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-xs text-gray-400 mt-1">
                    {msg.sender_name} ·{' '}
                    {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          {canAct && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
              <textarea
                className="flex-1 border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Type your reply…"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
              />
              <div className="flex flex-col justify-end">
                <Button onClick={handleSendReply} loading={sending} disabled={!replyText.trim()}>
                  Send
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Resolve Modal */}
        <Modal
          isOpen={showResolve}
          onClose={() => setShowResolve(false)}
          title="Resolve Case"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please provide resolution notes before marking this case as resolved.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution Notes *
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="Describe how this case was resolved…"
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowResolve(false)}>Cancel</Button>
              <Button onClick={handleResolve} loading={resolving}>Mark as Resolved</Button>
            </div>
          </div>
        </Modal>

        {/* Close Confirm */}
        <ConfirmDialog
          isOpen={showClose}
          onClose={() => setShowClose(false)}
          onConfirm={handleClose}
          title="Close Case"
          message="Are you sure you want to close this case? This action cannot be undone."
          confirmText="Close Case"
          confirmVariant="danger"
          loading={closing}
        />
      </div>
    </Layout>
  );
}
