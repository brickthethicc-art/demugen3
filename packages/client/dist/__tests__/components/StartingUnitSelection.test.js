import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useGameStore } from '../../src/store/game-store.js';
import { StartingUnitSelection } from '../../src/components/StartingUnitSelection.js';
import { CardType } from '@mugen/shared';
// Mock the game store
vi.mock('../../src/store/game-store.js', () => ({
    useGameStore: vi.fn(),
}));
const mockUseGameStore = vi.mocked(useGameStore);
function makeUnit(id, cost) {
    return {
        id,
        name: `Unit ${id}`,
        cardType: CardType.UNIT,
        hp: 10,
        maxHp: 10,
        atk: 3,
        movement: 2,
        range: 1,
        ability: {
            id: `ability-${id}`,
            name: 'Test Ability',
            description: 'Test description',
            cost: 2,
            abilityType: 'DAMAGE',
        },
        cost,
    };
}
describe('StartingUnitSelection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('renders unit selection screen', () => {
        mockUseGameStore.mockReturnValue({
            selectedDeck: [
                makeUnit('1', 5),
                makeUnit('2', 6),
                makeUnit('3', 7),
                makeUnit('4', 8),
                makeUnit('5', 9),
                makeUnit('6', 4),
                makeUnit('7', 3),
                makeUnit('8', 2),
            ],
            startingUnits: [],
            setStartingUnits: vi.fn(),
            confirmStartingUnits: vi.fn(),
        });
        render(_jsx(StartingUnitSelection, {}));
        expect(screen.getByText('Select 6 Starting Units')).toBeInTheDocument();
        expect(screen.getByText('Total Cost: 0 / 40')).toBeInTheDocument();
    });
    it('displays available units from deck', () => {
        const units = [
            makeUnit('1', 5),
            makeUnit('2', 6),
            makeUnit('3', 7),
        ];
        mockUseGameStore.mockReturnValue({
            selectedDeck: units,
            startingUnits: [],
            setStartingUnits: vi.fn(),
            confirmStartingUnits: vi.fn(),
        });
        render(_jsx(StartingUnitSelection, {}));
        expect(screen.getByText('Unit 1')).toBeInTheDocument();
        expect(screen.getByText('Unit 2')).toBeInTheDocument();
        expect(screen.getByText('Unit 3')).toBeInTheDocument();
    });
    it('shows current selection count', () => {
        const selectedUnits = [makeUnit('1', 5), makeUnit('2', 6)];
        mockUseGameStore.mockReturnValue({
            selectedDeck: [makeUnit('1', 5), makeUnit('2', 6), makeUnit('3', 7)],
            startingUnits: selectedUnits,
            setStartingUnits: vi.fn(),
            confirmStartingUnits: vi.fn(),
        });
        render(_jsx(StartingUnitSelection, {}));
        expect(screen.getByText('Selected: 2 / 6')).toBeInTheDocument();
    });
    it('calculates total cost correctly', () => {
        const selectedUnits = [makeUnit('1', 5), makeUnit('2', 6), makeUnit('3', 7)];
        mockUseGameStore.mockReturnValue({
            selectedDeck: selectedUnits,
            startingUnits: selectedUnits,
            setStartingUnits: vi.fn(),
            confirmStartingUnits: vi.fn(),
        });
        render(_jsx(StartingUnitSelection, {}));
        expect(screen.getByText('Total Cost: 18 / 40')).toBeInTheDocument();
    });
    it('shows cost limit warning when over limit', () => {
        const selectedUnits = [
            makeUnit('1', 10),
            makeUnit('2', 10),
            makeUnit('3', 10),
            makeUnit('4', 10),
            makeUnit('5', 10),
            makeUnit('6', 10),
        ];
        mockUseGameStore.mockReturnValue({
            selectedDeck: selectedUnits,
            startingUnits: selectedUnits,
            setStartingUnits: vi.fn(),
            confirmStartingUnits: vi.fn(),
        });
        render(_jsx(StartingUnitSelection, {}));
        expect(screen.getByText('Total Cost: 60 / 40')).toBeInTheDocument();
        expect(screen.getByText(/cost exceeds/i)).toBeInTheDocument();
    });
    it('enables confirm button when valid selection', () => {
        const selectedUnits = [
            makeUnit('1', 5),
            makeUnit('2', 6),
            makeUnit('3', 7),
            makeUnit('4', 8),
            makeUnit('5', 9),
            makeUnit('6', 4),
        ];
        mockUseGameStore.mockReturnValue({
            selectedDeck: selectedUnits,
            startingUnits: selectedUnits,
            setStartingUnits: vi.fn(),
            confirmStartingUnits: vi.fn(),
        });
        render(_jsx(StartingUnitSelection, {}));
        const confirmButton = screen.getByText('Confirm Selection');
        expect(confirmButton).not.toBeDisabled();
    });
    it('disables confirm button when invalid selection', () => {
        const selectedUnits = [
            makeUnit('1', 10),
            makeUnit('2', 10),
            makeUnit('3', 10),
            makeUnit('4', 10),
            makeUnit('5', 10),
            makeUnit('6', 10),
        ];
        mockUseGameStore.mockReturnValue({
            selectedDeck: selectedUnits,
            startingUnits: selectedUnits,
            setStartingUnits: vi.fn(),
            confirmStartingUnits: vi.fn(),
        });
        render(_jsx(StartingUnitSelection, {}));
        const confirmButton = screen.getByText('Confirm Selection');
        expect(confirmButton).toBeDisabled();
    });
    it('calls setStartingUnits when unit is clicked', () => {
        const setStartingUnits = vi.fn();
        const units = [makeUnit('1', 5), makeUnit('2', 6)];
        mockUseGameStore.mockReturnValue({
            selectedDeck: units,
            startingUnits: [],
            setStartingUnits,
            confirmStartingUnits: vi.fn(),
        });
        render(_jsx(StartingUnitSelection, {}));
        const unitCard = screen.getByText('Unit 1');
        unitCard.click();
        expect(setStartingUnits).toHaveBeenCalledWith([units[0]]);
    });
    it('calls confirmStartingUnits when confirm button is clicked', () => {
        const confirmStartingUnits = vi.fn();
        const selectedUnits = [
            makeUnit('1', 5),
            makeUnit('2', 6),
            makeUnit('3', 7),
            makeUnit('4', 8),
            makeUnit('5', 9),
            makeUnit('6', 4),
        ];
        mockUseGameStore.mockReturnValue({
            selectedDeck: selectedUnits,
            startingUnits: selectedUnits,
            setStartingUnits: vi.fn(),
            confirmStartingUnits,
        });
        render(_jsx(StartingUnitSelection, {}));
        const confirmButton = screen.getByText('Confirm Selection');
        confirmButton.click();
        expect(confirmStartingUnits).toHaveBeenCalled();
    });
});
//# sourceMappingURL=StartingUnitSelection.test.js.map