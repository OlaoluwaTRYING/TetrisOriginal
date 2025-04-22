// Define game modes
export const gameModes = {
    classic: {
        name: "Classic",
        interval: 500, // Default speed
        scoringMultiplier: 1, // Normal scoring
        description: "Play the traditional Tetris game."
    },
    timeAttack: {
        name: "Time Attack",
        interval: 300, // Faster speed
        scoringMultiplier: 2, // Double points
        description: "Clear as many lines as possible in 2 minutes!"
    },
    endless: {
        name: "Mind chill",
        interval: 700, // Slower speed
        scoringMultiplier: 1, // Normal scoring
        description: "Relax your mind. Play endlessly without time limits."
    },
    arcade: {
        name: "Arcade",
        interval: 500, // Slower speed
        scoringMultiplier: 1, // Normal scoring
        description: "Multiple fields."
    }
};

// Function to get the selected game mode configuration
export function getGameModeConfig(mode) {
    return gameModes[mode] || gameModes.classic; // Default to classic if mode is invalid
}