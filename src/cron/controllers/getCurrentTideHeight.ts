import tideData from '../../config/tides2026.json';

export const getCurrentTideHeight = (): number => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // example: "2026-01-01"
    const todayEntry = tideData.days.find((d) => d.date === todayStr);

    // If we don't have today tide, we use the mean level from the json file.
    if (!todayEntry) {
        console.warn(`[Tide] No data for ${todayStr}, using mean level`);
        return tideData.metadata.mean_level_m;
    };

    // Transfrom time string in millisecond number.
    // Example: "2026-04-25T14:14:00-03:00" to 1745176440000.
    const mapped = todayEntry.tides.map((t) => ({

        // (datetime: "2026-04-25T14:14:00-03:00") will be (dateTimeMs: 1745176440000)
        dateTimeMs: new Date(t.datetime).getTime(),

        // Tide height. Example: 2.0
        height: t.height_m,
    }));

    // Sort tides earlist to latest.
    const tides = mapped.sort((a, b) => a.dateTimeMs - b.dateTimeMs);

    // Current moment to milliseconds.
    const nowMs = now.getTime();

    for (let i = 0; i < tides.length - 1; i++) {
        
        const before = tides[i];
        const after = tides[i + 1];

        if (nowMs >= before.dateTimeMs && nowMs <= after.dateTimeMs) {

            // Applying linear interpolation formula to find current tide.
            const ratio = (nowMs - before.dateTimeMs) / (after.dateTimeMs - before.dateTimeMs);
            const tideHeight = before.height + ratio * (after.height - before.height);

            // Drop some decimals. Example: 1.35356 -> 1.35
            return Math.round(tideHeight * 100) / 100;
        };
    };

    // Before the first tide → use the first tide's height
    if (nowMs < tides[0].dateTimeMs) {
        return tides[0].height;

 
    // After the last tide → use the last tide's height
    } else {
        return tides[tides.length - 1].height;
    };
};