// NEW COMPONENT: Display batch with location allocations
import React from 'react';
import { MapPin, Package, Calendar, AlertTriangle } from 'lucide-react';

const BatchLocationDisplay = ({ batch }) => {
  /**
   * batch structure:
   * {
   *   id: 1,
   *   batch_number: 'BATCH-001',
   *   total_current_quantity: 100,
   *   total_reserved_quantity: 10,
   *   expiry_date: '2025-12-31',
   *   days_until_expiry: 45,
   *   is_near_expiry: false,
   *   allocations: [
   *     {
   *       location_id: 5,
   *       location_name: 'Store A',
   *       current_quantity: 70,
   *       reserved_quantity: 5,
   *       available_quantity: 65
   *     },
   *     {
   *       location_id: 8,
   *       location_name: 'Store B',
   *       current_quantity: 30,
   *       reserved_quantity: 5,
   *       available_quantity: 25
   *     }
   *   ]
   * }
   */

  const getStatusColor = () => {
    if (batch.is_expired) return 'text-red-600 bg-red-50';
    if (batch.is_near_expiry) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getExpiryText = () => {
    if (batch.is_expired) return 'Expired';
    if (batch.is_near_expiry) return `Expires in ${batch.days_until_expiry} days`;
    return `Expires: ${batch.expiry_date}`;
  };

  return (
    <div className="card border border-gray-200 p-4">
      {/* Batch Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {batch.batch_number}
            </h3>
          </div>
          {batch.item_name && (
            <p className="text-sm text-gray-600 mt-1">
              {batch.item_name} ({batch.item_code})
            </p>
          )}
        </div>

        {/* Expiry Status Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getExpiryText()}
        </div>
      </div>

      {/* Total Quantities */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-600">Total Quantity</p>
          <p className="text-lg font-semibold text-gray-900">
            {batch.total_current_quantity}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Available</p>
          <p className="text-lg font-semibold text-green-600">
            {batch.total_current_quantity - batch.total_reserved_quantity}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Reserved</p>
          <p className="text-lg font-semibold text-orange-600">
            {batch.total_reserved_quantity}
          </p>
        </div>
      </div>

      {/* Location Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MapPin className="h-4 w-4" />
          <span>Locations ({batch.allocations?.length || 0})</span>
        </div>

        {batch.allocations && batch.allocations.length > 0 ? (
          <div className="space-y-2">
            {batch.allocations.map((allocation) => (
              <div
                key={allocation.location_id}
                className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-100"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {allocation.location_name}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                    <span>
                      Total: <span className="font-medium">{allocation.current_quantity}</span>
                    </span>
                    {allocation.reserved_quantity > 0 && (
                      <span className="text-orange-600">
                        Reserved: <span className="font-medium">{allocation.reserved_quantity}</span>
                      </span>
                    )}
                    <span className="text-green-600">
                      Available: <span className="font-medium">{allocation.available_quantity}</span>
                    </span>
                  </div>
                </div>

                {/* Percentage Bar */}
                <div className="ml-4">
                  <div className="text-xs text-gray-600 mb-1">
                    {Math.round((allocation.current_quantity / batch.total_current_quantity) * 100)}%
                  </div>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(allocation.current_quantity / batch.total_current_quantity) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No allocations</p>
        )}
      </div>

      {/* Dates */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Received: {new Date(batch.received_date).toLocaleDateString()}</span>
        </div>
        {batch.manufacture_date && (
          <div>
            Mfg: {new Date(batch.manufacture_date).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Expiry Warning */}
      {batch.is_near_expiry && !batch.is_expired && (
        <div className="mt-3 flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-orange-900">Approaching Expiry</p>
            <p className="text-xs text-orange-700 mt-0.5">
              This batch expires in {batch.days_until_expiry} days. Consider issuing soon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchLocationDisplay;
