import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, Hand } from 'lucide-react';
export function StandbyPhase({ status }) {
    if (!status.isActive) {
        return null;
    }
    return (_jsx("div", { className: "bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(AlertCircle, { size: 20, className: "text-yellow-400" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-yellow-400 mb-2", children: "Standby Phase" }), _jsx("p", { className: "text-yellow-200 text-sm mb-3", children: status.message }), _jsx("div", { className: "space-y-2", children: status.needsHandDiscard && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-yellow-300", children: [_jsx(Hand, { size: 16 }), _jsx("span", { children: "Hand size exceeded - discard required" })] })) }), !status.canProgress && (_jsx("div", { className: "mt-3 pt-3 border-t border-yellow-500/20", children: _jsx("p", { className: "text-xs text-yellow-400", children: "Complete all requirements before proceeding to the next phase." }) }))] })] }) }));
}
//# sourceMappingURL=StandbyPhase.js.map