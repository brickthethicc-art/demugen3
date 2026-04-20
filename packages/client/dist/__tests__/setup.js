import { vi } from 'vitest';
import '@testing-library/jest-dom';
class MockScene {
}
vi.mock('phaser', () => ({
    default: {
        AUTO: 0,
        Scale: { FIT: 0, CENTER_BOTH: 0 },
        Game: vi.fn(),
        Scene: MockScene,
        GameObjects: {
            Graphics: vi.fn(),
            Container: vi.fn(),
            Text: vi.fn(),
        },
    },
}));
//# sourceMappingURL=setup.js.map