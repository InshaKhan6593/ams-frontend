// src/pages/Inspections/InspectionWorkflowProgress.jsx
import React from 'react';
import { Check, Clock, XCircle } from 'lucide-react';

const InspectionWorkflowProgress = ({ inspection }) => {
  if (!inspection) return null;

  const stages = inspection.workflow_stages || [];
  const currentStage = inspection.stage;
  const isRejected = currentStage === 'REJECTED';
  const isCompleted = currentStage === 'COMPLETED';

  // Find current stage index
  const currentIndex = stages.findIndex(s => s.stage === currentStage);

  const getStageStatus = (index, stage) => {
    if (isRejected) {
      return index <= currentIndex ? 'rejected' : 'pending';
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
                    <p className={`text-xs font-medium ${
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

      {/* Current Handler */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Current Handler:</span>
          <span className="font-medium text-gray-900">{inspection.current_handler}</span>
        </div>
      </div>

      {/* Rejection Info */}
      {isRejected && inspection.rejection_reason && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
          <p className="text-xs text-red-700">{inspection.rejection_reason}</p>
          {inspection.rejected_by_name && (
            <p className="text-xs text-red-600 mt-1">
              Rejected by: {inspection.rejected_by_name}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default InspectionWorkflowProgress;