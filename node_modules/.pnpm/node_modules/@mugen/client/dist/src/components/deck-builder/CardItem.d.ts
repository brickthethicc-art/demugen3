import type { Card } from '@mugen/shared';
interface CardItemProps {
    card: Card;
    onClick: () => void;
    mode: 'add' | 'remove';
    disabled?: boolean;
}
export declare function CardItem({ card, onClick, mode, disabled }: CardItemProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=CardItem.d.ts.map