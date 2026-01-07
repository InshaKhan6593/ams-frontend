// src/pages/Inspections/InspectionWorkflowProgress.jsx
import React from 'react';
import { Check, Clock, XCircle } from 'lucide-react';

const InspectionWorkflowProgress = ({ inspection }) => {
  if (!inspection) return null;

  // Use the new workflow_handlers data if available, otherwise fallback to workflow_stages
  const handlers = inspection.workflow_handlers || [];
  const stages = inspection.workflow_stages || [];
  const currentStage = inspection.stage;
  const isRejected = currentStage === 'REJECTED';
  const isCompleted = currentStage === 'COMPLETED';

  // Find current stage index
  // For rejected inspections, use rejection_stage to determine how far they got
  let currentIndex;
  if (isRejected && inspection.rejection_stage) {
    currentIndex = stages.findIndex(s => s.stage === inspection.rejection_stage);
  } else {
    currentIndex = stages.findIndex(s => s.stage === currentStage);
  }

  // Get handler info for a specific stage - now uses workflow_handlers array
  const getStageHandlerInfo = (stage) => {
    // Find handler from the new workflow_handlers array
    const handler = handlers.find(h => h.stage === stage);
    if (handler) {
      return {
        name: handler.user_name,
        date: handler.timestamp,
        role: handler.role,
        completed: handler.completed
      };
    }

    // Fallback to old method if workflow_handlers not available
    switch (stage) {
      case 'INITIATED':
        return {
          name: inspection.initiated_by_name,
          date: inspection.initiated_at
        };
      case 'STOCK_DETAILS':
        return {
          name: inspection.stock_filled_by_name,
          date: inspection.stock_filled_at
        };
      case 'CENTRAL_REGISTER':
        return {
          name: inspection.central_store_filled_by_name,
          date: inspection.central_store_filled_at
        };
      case 'AUDIT_REVIEW':
        return {
          name: inspection.auditor_reviewed_by_name,
          date: inspection.auditor_reviewed_at
        };
      case 'COMPLETED':
        return {
          name: inspection.auditor_reviewed_by_name,
          date: inspection.auditor_reviewed_at
        };
      case 'REJECTED':
        return {
          name: inspection.rejected_by_name,
          date: inspection.rejected_at
        };
      default:
        return { name: null, date: null };
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStageStatus = (index, stage) => {
    if (isRejected) {
      // Stages before rejection are completed
      if (index < currentIndex) {
        return 'completed';
      }
      // The rejection stage itself is rejected
      if (index === currentIndex) {
        return 'rejected';
      }
      // Stages after rejection are pending
      return 'pending';
    }
    if (isCompleted) {
      return 'completed';
    }
    if (index < currentIndex) {
      return 'completed';
    }
    if (index === currentIndex) {
      return 'current';
    }
    return 'pending';
  };

  const getStageIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-white" />;
      case 'current':
        return <Clock className="w-4 h-4 text-white" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-white" />;
      default:
        return <div className="w-2 h-2 bg-white rounded-full" />;
    }
  };

  const getStageColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'current':
        return 'bg-blue-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getLineColor = (index) => {
    const status = getStageStatus(index, stages[index]);
    if (status === 'completed' || status === 'rejected') {
      return status === 'rejected' ? 'bg-red-500' : 'bg-green-500';
    }
    return 'bg-gray-300';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      {/* Workflow Type Badge */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-900">
          Workflow Progress
        </h3>
        <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
          {inspection.workflow_type}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        {/* Stages */}
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const status = getStageStatus(index, stage);
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.stage} className="flex items-center flex-1">
                {/* Stage Circle */}
                <div className="relative flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full ${getStageColor(status)} flex items-center justify-center z-10`}>
                    {getStageIcon(status)}
                  </div>
                  
                  {/* Stage Info */}
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-bold ${
                      status === 'current' ? 'text-blue-600' :
                      status === 'completed' ? 'text-green-600' :
                      status === 'rejected' ? 'text-red-600' :
                      'text-gray-500'
                    }`}>
                      {stage.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stage.description}
                    </p>
                    {/* Handler Name and Date for completed/rejected stages */}
                    {(status === 'completed' || status === 'current' || status === 'rejected') && getStageHandlerInfo(stage.stage).name && (
                      <p className={`text-xs mt-1 ${status === 'rejected' ? 'text-red-700' : 'text-gray-700'}`}>
                        <span className={status === 'rejected' ? 'text-red-500' : 'text-gray-500'}>By:</span> {getStageHandlerInfo(stage.stage).name}
                      </p>
                    )}
                    {/* Handler Date for completed/rejected stages */}
                    {(status === 'completed' || status === 'current' || status === 'rejected') && getStageHandlerInfo(stage.stage).date && (
                      <p className={`text-xs mt-0.5 ${status === 'rejected' ? 'text-red-600' : 'text-gray-500'}`}>
                        {formatDate(getStageHandlerInfo(stage.stage).date)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div className={`flex-1 h-1 ${getLineColor(index)} mx-2 -mt-12`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejection Info */}
      {isRejected && inspection.rejection_reason && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm font-semibold text-red-900 mb-2">Certificate Rejected</p>

          {/* Rejection Details */}
          <div className="space-y-2 mb-3">
            <div>
              <p className="text-xs font-medium text-red-700">Rejected At:</p>
              <p className="text-xs text-red-800">{inspection.rejection_stage?.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-red-700">Rejected By:</p>
              <p className="text-xs text-red-800">{inspection.rejected_by_name || 'N/A'}</p>
            </div>
            {inspection.rejected_at && (
              <div>
                <p className="text-xs font-medium text-red-700">Rejection Date:</p>
                <p className="text-xs text-red-800">{formatDate(inspection.rejected_at)}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-red-700">Reason:</p>
              <p className="text-xs text-red-800">{inspection.rejection_reason}</p>
            </div>
          </div>

          {/* Show completed stages before rejection */}
          {handlers.filter(h => h.completed && h.user_name).length > 0 && (
            <div className="pt-2 border-t border-red-200">
              <p className="text-xs font-medium text-red-700 mb-1">Stages Completed Before Rejection:</p>
              <div className="space-y-1">
                {handlers.filter(h => h.completed && h.user_name).map((handler) => (
                  <div key={handler.stage} className="text-xs text-red-800">
                    • {handler.label}: {handler.user_name} ({formatDate(handler.timestamp)})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InspectionWorkflowProgress;