import type { Card } from '@mugen/shared';
interface DiscardPileEntry {
    card: Card;
    timestamp: number;
    source: 'unit_death' | 'sorcery_played' | 'other';
    unitInstance?: any;
}
interface DiscardPileViewerProps {
    entries: DiscardPileEntry[];
    onClose: () => void;
    count: number;
}
export declare function DiscardPileViewer({ entries, onClose, count }: DiscardPileViewerProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=DiscardPileViewer.d.ts.map