import { AlertCircle, Users, Hand } from 'lucide-react';
import type { StandbyPhaseStatus } from '@mugen/shared';

interface StandbyPhaseProps {
  status: StandbyPhaseStatus;
}

export function StandbyPhase({ status }: StandbyPhaseProps) {
  if (!status.isActive) {
    return null;
  }

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertCircle size={20} className="text-yellow-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Standby Phase</h3>
          
          <p className="text-yellow-200 text-sm mb-3">{status.message}</p>
          
          <div className="space-y-2">
            {status.needsBenchDeployment && (
              <div className="flex items-center gap-2 text-xs text-yellow-300">
                <Users size={16} />
                <span>Bench deployment required</span>
              </div>
            )}
            
            {status.needsHandDiscard && (
              <div className="flex items-center gap-2 text-xs text-yellow-300">
                <Hand size={16} />
                <span>Hand size exceeded - discard required</span>
              </div>
            )}
          </div>
          
          {!status.canProgress && (
            <div className="mt-3 pt-3 border-t border-yellow-500/20">
              <p className="text-xs text-yellow-400">
                Complete all requirements before proceeding to the next phase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
