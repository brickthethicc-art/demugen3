import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GameBoard } from './GameBoard.js';
import { GameHUD } from './GameHUD.js';
import { BenchUnits } from './BenchUnits.js';
import { HoverPanel } from './HoverPanel.js';
import { MainDeckPile } from './MainDeckPile.js';
import { DiscardPile } from './DiscardPile.js';
import { HandLimitModal } from './HandLimitModal.js';
export function GameScreen() {
    return (_jsxs("div", { "data-testid": "game-screen", className: "min-h-screen bg-mugen-bg flex", children: [_jsx(HoverPanel, {}), _jsxs("div", { className: "flex-1 flex flex-col items-center", children: [_jsx("div", { className: "flex items-start justify-end pt-8 pr-32 w-full", children: _jsx(GameBoard, {}) }), _jsxs("div", { className: "flex justify-center pr-32 w-full items-start relative", children: [_jsx("div", { className: "flex-1" }), _jsxs("div", { className: "absolute flex flex-col gap-2 -mt-[181px]", style: { right: '875px' }, children: [_jsx(DiscardPile, {}), _jsx(MainDeckPile, {})] }), _jsx("div", { className: "absolute", style: { right: '203px', top: '5px' }, children: _jsx(BenchUnits, {}) })] })] }), _jsx(GameHUD, {}), _jsx(HandLimitModal, {})] }));
}
//# sourceMappingURL=GameScreen.js.map