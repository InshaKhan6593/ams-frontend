// src/pages/Inspections/InspectionForm.jsx - FIXED
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Send, CheckCircle, XCircle } from 'lucide-react';
import { inspectionsAPI } from '../../api/inspections';
import { locationsAPI } from '../../api/locations';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import InspectionWorkflowProgress from './InspectionWorkflowProgress';
import InspectionStage1Form from './InspectionStage1Form';
import InspectionStage2Form from './InspectionStage2Form';
import InspectionStage3Form from './InspectionStage3Form';
import InspectionStage4Form from './InspectionStage4Form';
import { inspectionsKeys } from '../../hooks/queries/useInspections';

// Helper function to extract readable error messages from API responses
const extractErrorMessage = (err) => {
  const data = err.response?.data;

  if (!data) {
    return err.message || 'An unexpected error occurred';
  }

  // If it's a string, return directly
  if (typeof data === 'string') {
    return data;
  }

  // Check for common error fields first
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  if (data.message) return data.message;

  // Handle field-specific validation errors (DRF format)
  // e.g., {"contract_no": ["This field is required."], "contractor_name": ["Enter a valid value."]}
  const fieldErrors = [];
  const fieldLabelMap = {
    contract_no: 'Contract No',
    contract_date: 'Contract Date',
    contractor_name: 'Contractor Name',
    contractor_address: 'Contractor Address',
    consignee_name: 'Consignee Name',
    consignee_designation: 'Consignee Designation',
    indenter: 'Indenter',
    indent_no: 'Indent No',
    date: 'Certificate Date',
    department: 'Department',
    date_of_delivery: 'Delivery Date',
    delivery_type: 'Delivery Type',
    inspected_by: 'Inspected By',
    date_of_inspection: 'Inspection Date',
    remarks: 'Remarks',
    non_field_errors: 'Error',
  };

  for (const [field, errors] of Object.entries(data)) {
    if (Array.isArray(errors)) {
      const label = fieldLabelMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      errors.forEach(msg => {
        fieldErrors.push(`${label}: ${msg}`);
      });
    } else if (typeof errors === 'string') {
      const label = fieldLabelMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      fieldErrors.push(`${label}: ${errors}`);
    }
  }

  if (fieldErrors.length > 0) {
    return fieldErrors.join('\n');
  }

  return 'Failed to save. Please check your input and try again.';
};

const InspectionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { isStockIncharge: checkIsStockIncharge, isCentralStoreIncharge: checkIsCentralStoreIncharge, hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [inspection, setInspection] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [canReject, setCanReject] = useState(false);
  
  // Track if initial data has been loaded to prevent re-fetching
  const initializedRef = useRef(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // Only fetch once when component mounts or id changes
    if (isEditMode) {
      fetchInspection();
    } else if (!initializedRef.current) {
      fetchCreationOptions();
      initializedRef.current = true;
    }
  }, [id]);

  const fetchInspection = async () => {
    try {
      setLoading(true);
      const data = await inspectionsAPI.get(id);
      setInspection(data);
      setCanEdit(data.can_edit || false);
      setCanSubmit(data.can_submit || false);
      setCanReject(data.can_reject || false);
      setError('');
    } catch (err) {
      setError('Failed to load inspection certificate');
      console.error('Error fetching inspection:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreationOptions = async () => {
    try {
      setLoading(true);
      const data = await inspectionsAPI.getCreationOptions();
      setDepartments(data.departments || []);
      
      // Initialize new inspection
      setInspection({
        date: new Date().toISOString().split('T')[0],
        department: data.departments.length === 1 ? data.departments[0].id : '',
        delivery_type: 'FULL',
        stage: 'INITIATED',
        status: 'IN_PROGRESS',
        inspection_items: [],
      });
      setCanEdit(true);
      setCanSubmit(true);
      setError('');
    } catch (err) {
      setError('Failed to load creation options');
      console.error('Error fetching creation options:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update inspection data from child forms (for items and other changes)
  // This keeps all form data in sync with parent state
  const handleInspectionChange = useCallback((updates) => {
    setInspection(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Validate required fields for Stage 1 (INITIATED)
  const validateRequiredFields = (data) => {
    const requiredFields = [
      { field: 'date', label: 'Certificate Date' },
      { field: 'department', label: 'Department' },
      { field: 'contract_no', label: 'Contract No' },
      { field: 'contractor_name', label: 'Contractor Name' },
      { field: 'consignee_name', label: 'Consignee Name' },
      { field: 'consignee_designation', label: 'Consignee Designation' },
      { field: 'indenter', label: 'Indenter' },
      { field: 'indent_no', label: 'Indent No' },
    ];

    const missingFields = requiredFields.filter(({ field }) => {
      const value = data[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      const fieldLabels = missingFields.map(f => f.label).join(', ');
      throw new Error(`Please fill in all required fields: ${fieldLabels}`);
    }

    // Validate at least one inspection item
    if (!data.inspection_items || data.inspection_items.length === 0) {
      throw new Error('Please add at least one inspection item');
    }

    return true;
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      setError('');

      if (isEditMode) {
        const updated = await inspectionsAPI.patch(id, formData);
        setInspection(updated);
        setSuccess('Inspection certificate saved successfully!');

        // Invalidate queries to ensure lists are updated
        queryClient.invalidateQueries({ queryKey: inspectionsKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: inspectionsKeys.lists() });
      } else {
        const created = await inspectionsAPI.create(formData);
        setSuccess('Inspection certificate created successfully!');

        // Invalidate queries for new inspection
        queryClient.invalidateQueries({ queryKey: inspectionsKeys.lists() });
        queryClient.invalidateQueries({ queryKey: ['pendingTasks'] });

        setTimeout(() => navigate(`/dashboard/inspections/${created.id}`), 1500);
      }
    } catch (err) {
      console.error('Error saving inspection:', err);
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitStage = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Validate required fields for INITIATED stage (new certificates)
      if (!isEditMode || inspection.stage === 'INITIATED') {
        try {
          validateRequiredFields(inspection);
        } catch (validationError) {
          setError(validationError.message);
          setSubmitting(false);
          // Scroll to top to show error message
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      let inspectionId = id;
      let createdInspection = null;

      // If this is a new inspection (no ID yet), create it first
      if (!isEditMode) {
        console.log('Creating new inspection and submitting directly...');
        createdInspection = await inspectionsAPI.create(inspection);
        inspectionId = createdInspection.id;
        console.log('Created inspection with ID:', inspectionId);
      } else {
        // CRITICAL FIX: Save current state before submitting to next stage
        // Only send the fields that can be edited, not the entire inspection object
        console.log('Saving current inspection data before stage transition...');
        console.log('Inspection ID:', inspectionId);
        console.log('Current stage:', inspection.stage);

        // Prepare clean data - only editable fields that match backend model
        const cleanData = {
          // Basic info
          date: inspection.date,
          department: inspection.department,

          // Contract details (backend uses contract_no, NOT contract_number)
          contract_no: inspection.contract_no || inspection.contract_number,
          contract_date: inspection.contract_date,
          contractor_name: inspection.contractor_name,
          contractor_address: inspection.contractor_address,

          // Indent details
          indenter: inspection.indenter,
          indent_no: inspection.indent_no,

          // Delivery details
          date_of_delivery: inspection.date_of_delivery,
          delivery_type: inspection.delivery_type,

          // Inspection details
          inspected_by: inspection.inspected_by,
          date_of_inspection: inspection.date_of_inspection,

          // Consignee details
          consignee_name: inspection.consignee_name,
          consignee_designation: inspection.consignee_designation,

          // Finance
          finance_check_date: inspection.finance_check_date,

          // Other
          remarks: inspection.remarks,
        };

        // Remove undefined/null values
        Object.keys(cleanData).forEach(key => {
          if (cleanData[key] === undefined || cleanData[key] === null) {
            delete cleanData[key];
          }
        });

        console.log('Clean data being sent:', cleanData);

        try {
          await inspectionsAPI.patch(inspectionId, cleanData);
          console.log('Inspection data saved successfully');
        } catch (patchError) {
          console.error('PATCH request failed!');
          console.error('PATCH Error:', patchError);
          console.error('PATCH Response:', patchError.response);
          console.error('PATCH Response Data:', patchError.response?.data);
          throw patchError; // Re-throw to be caught by outer catch
        }
      }

      // Now submit to the appropriate next stage
      let result;
      const stage = createdInspection ? createdInspection.stage : inspection.stage;

      // Pre-submission validation for CENTRAL_REGISTER
      if (stage === 'CENTRAL_REGISTER') {
        const linkedItems = inspection.inspection_items?.filter(item => item.is_item_linked) || [];
        const unlinkedItems = inspection.inspection_items?.filter(
          item => item.accepted_quantity > 0 && !item.is_item_linked
        ) || [];

        console.log('Pre-submission check:');
        console.log('- Total items:', inspection.inspection_items?.length || 0);
        console.log('- Linked items:', linkedItems.length);
        console.log('- Unlinked items:', unlinkedItems.length);

        if (unlinkedItems.length > 0) {
          const unlinkedDescriptions = unlinkedItems.slice(0, 3).map(item =>
            item.item_description || item.description || 'Unnamed item'
          );
          setError(
            `Cannot submit: ${unlinkedItems.length} items still need to be linked.\n\n` +
            `Examples:\n- ${unlinkedDescriptions.join('\n- ')}\n\n` +
            `Please link all items before submitting to audit review.`
          );
          setSubmitting(false);
          return;
        }
      }
      
      if (stage === 'INITIATED') {
        result = await inspectionsAPI.submitToStockIncharge(inspectionId);
      } else if (stage === 'STOCK_DETAILS') {
        result = await inspectionsAPI.submitStockDetails(inspectionId);
      } else if (stage === 'CENTRAL_REGISTER') {
        console.log('Submitting CENTRAL_REGISTER stage for inspection ID:', inspectionId);
        result = await inspectionsAPI.submitCentralRegister(inspectionId);
      } else if (stage === 'AUDIT_REVIEW') {
        result = await inspectionsAPI.approveCertificate(inspectionId);
      }

      setSuccess(result.message || 'Certificate submitted successfully!');

      // Invalidate all inspection queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ queryKey: inspectionsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['pendingTasks'] });

      // Navigate to the inspection detail page (or reload if already there)
      setTimeout(() => {
        if (isEditMode) {
          // Already on the page, refetch fresh data
          fetchInspection();
        } else {
          // Navigate to the newly created inspection
          navigate(`/dashboard/inspections/${inspectionId}`, { replace: true });
        }
      }, 1500);

    } catch (err) {
      console.error('Error submitting stage:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);

      // Handle detailed error messages for CENTRAL_REGISTER validation
      if (err.response?.data?.error) {
        const errorData = err.response.data;
        let errorMessage = errorData.error;

        // Add details if unlinked items exist
        if (errorData.unlinked_count) {
          errorMessage += `\n\nUnlinked items count: ${errorData.unlinked_count}`;
          if (errorData.examples && errorData.examples.length > 0) {
            errorMessage += `\nExamples: ${errorData.examples.join(', ')}`;
          }
          if (errorData.hint) {
            errorMessage += `\n\n${errorData.hint}`;
          }
        }

        setError(errorMessage);
      } else {
        // Use the helper for field-specific validation errors
        setError(extractErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const result = await inspectionsAPI.rejectCertificate(id, rejectionReason);

      // Build success message with cleanup details
      let successMessage = result.message || 'Certificate rejected successfully';

      if (result.deleted_items && result.deleted_items.length > 0) {
        successMessage += '\n\nDeleted items:\n' + result.deleted_items.map(item => `• ${item}`).join('\n');
      }

      if (result.deleted_categories && result.deleted_categories.length > 0) {
        successMessage += '\n\nDeleted categories:\n' + result.deleted_categories.map(cat => `• ${cat}`).join('\n');
      }

      if (result.cleanup_warnings && result.cleanup_warnings.length > 0) {
        successMessage += '\n\nWarnings:\n' + result.cleanup_warnings.map(warning => `⚠ ${warning}`).join('\n');
      }

      setSuccess(successMessage);
      setShowRejectModal(false);

      setTimeout(() => {
        fetchInspection();
      }, 2000);
    } catch (err) {
      console.error('Error rejecting certificate:', err);
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmitButtonText = () => {
    const stage = inspection?.stage;
    if (!isEditMode) return 'Create & Submit to Stock Incharge';
    if (stage === 'AUDIT_REVIEW') return 'Approve Certificate';
    return 'Submit to Next Stage';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        No inspection data available
      </div>
    );
  }

  const currentStage = inspection.stage;
  const isRejected = currentStage === 'REJECTED';
  const isCompleted = currentStage === 'COMPLETED';

  // FIX: Override isReadOnly for STOCK_DETAILS stage
  // Force editable for Stock Incharge in STOCK_DETAILS stage
  // Uses new permission hook that supports both legacy roles and Django Groups
  const isStockIncharge = checkIsStockIncharge() || hasPermission('can_fill_stock_details');
  const isStockDetailsStage = currentStage === 'STOCK_DETAILS';

  // FIX: Override isReadOnly for CENTRAL_REGISTER stage
  // Force editable for Central Store Incharge in CENTRAL_REGISTER stage
  const isCentralStoreInchargeUser = checkIsCentralStoreIncharge() || hasPermission('can_fill_central_register');
  const isCentralRegisterStage = currentStage === 'CENTRAL_REGISTER';

  let isReadOnly = !canEdit || isRejected || isCompleted;

  // Override: Stock Incharge can always edit in STOCK_DETAILS stage
  if (isStockDetailsStage && isStockIncharge) {
    isReadOnly = false;
  }

  // Override: Central Store Incharge can always edit in CENTRAL_REGISTER stage
  if (isCentralRegisterStage && isCentralStoreInchargeUser) {
    isReadOnly = false;
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/inspections')}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {isEditMode ? `Inspection Certificate: ${inspection.contract_no}` : 'New Inspection Certificate'}
            </h1>
            <p className="text-xs text-gray-600 mt-0">
              {inspection.stage_display || 'Stage 1: Basic Information'}
            </p>
          </div>
        </div>

        {/* Status Badges */}
        {isEditMode && (
          <div className="flex items-center gap-2">
            {isCompleted && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                ✓ Completed
              </span>
            )}
            {isRejected && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                ✗ Rejected
              </span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs whitespace-pre-line">
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs whitespace-pre-line">
          <strong className="font-semibold">Success:</strong> {success}
        </div>
      )}

      {/* Workflow Progress - Only for edit mode */}
      {isEditMode && inspection.workflow_stages && (
        <InspectionWorkflowProgress inspection={inspection} />
      )}

      {/* Stage-specific Form */}
      {currentStage === 'INITIATED' && (
        <InspectionStage1Form
          key={id || 'new'}
          inspection={inspection}
          departments={departments}
          isReadOnly={isReadOnly}
          isEditMode={isEditMode}
          onSave={handleSave}
          onInspectionChange={handleInspectionChange}
          saving={saving}
        />
      )}

      {currentStage === 'STOCK_DETAILS' && (
        <InspectionStage2Form
          inspection={inspection}
          isReadOnly={isReadOnly}
          onSave={handleInspectionChange}
        />
      )}

      {currentStage === 'CENTRAL_REGISTER' && (
        <InspectionStage3Form
          inspection={inspection}
          isReadOnly={isReadOnly}
          onSave={handleSave}
          saving={saving}
          onRefresh={fetchInspection}
        />
      )}

      {currentStage === 'AUDIT_REVIEW' && (
        <InspectionStage4Form
          inspection={inspection}
          isReadOnly={isReadOnly}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* Action Buttons */}
      {!isRejected && !isCompleted && (
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEditMode && canReject && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={submitting}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/dashboard/inspections')}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              {/* Save button - show for edit mode OR for Stock Incharge in STOCK_DETAILS OR Central Store Incharge in CENTRAL_REGISTER */}
              {(isEditMode && canEdit) || (isStockDetailsStage && isStockIncharge) || (isCentralRegisterStage && isCentralStoreInchargeUser) ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSave(inspection);
                  }}
                  disabled={saving}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              ) : null}

              {/* Submit button - show if canSubmit OR if Stock Incharge in STOCK_DETAILS OR Central Store Incharge in CENTRAL_REGISTER */}
              {canSubmit || (isStockDetailsStage && isStockIncharge) || (isCentralRegisterStage && isCentralStoreInchargeUser) ? (
                <button
                  onClick={handleSubmitStage}
                  disabled={submitting}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {currentStage === 'AUDIT_REVIEW' ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {submitting ? 'Submitting...' : getSubmitButtonText()}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Reject Certificate</h3>
            <p className="text-xs text-gray-600 mb-3">
              Please provide a reason for rejecting this certificate:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="4"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter rejection reason..."
            />
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submitting || !rejectionReason.trim()}
                className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionForm;