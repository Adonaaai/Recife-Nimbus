import tideData from '../../config/tides2026.json';
import { z } from 'zod';

// Validate tide data structure at import time.
const TideSchema = z.object({
    datetime: z.string(),
    height_m: z.number()
});

const DaySchema = z.object({
    date: z.string(),
    tides: z.array(TideSchema)
});

const TideDataSchema = z.object({
    days: z.array(DaySchema),
    metadata: z.object({
        mean_level_m: z.number()
    })
});

let validatedTideData: z.infer<typeof TideDataSchema>;
try {
    validatedTideData = TideDataSchema.parse(tideData);
} catch (err) {
    console.error('[TIDE] Invalid tide data file:', err);
    throw new Error('Failed to load tides2026.json - file appears to be corrupted or malformed');
}

export const getForecastTideHeight = (): number => {
    const now = new Date();
    
    // Helper function for especifically Recife UTC
    const getRecifeDateStr = (date: Date) => {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Recife',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date);
    }; 
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = getRecifeDateStr(now); // example "2026-05-03"
    const tomorrowStr = getRecifeDateStr(tomorrow);

    // Getting today and tomorrow objects.
    const todayEntry = validatedTideData.days.find((d) => d.date === todayStr);
    const tomorrowEntry = validatedTideData.days.find((d) => d.date === tomorrowStr);

    // If we don't have today tide, we use the mean level from the json file.
    if (!todayEntry) {
        console.warn(`[Tide] No data for ${todayStr}, using mean level`);
        return validatedTideData.metadata.mean_level_m;
    };

    //=== Today and tomorrow tides merged. =======================
    const tides = [
        ...(todayEntry?.tides ?? []),
        ...(tomorrowEntry?.tides ?? [])
    ]   

        // Transfrom time string in millisecond number.
        // Example: "2026-04-25T14:14:00-03:00" to 1745176440000.
        .map((t) => ({

            // (datetime: "2026-04-25T14:14:00-03:00") will be (dateTimeMs: 1745176440000)
            dateTimeMs: new Date(t.datetime).getTime(),

            // Tide height. Example: 2.0
            height: t.height_m,
        }))
        
        .sort((a, b) => a.dateTimeMs - b.dateTimeMs);
        
    // ===========================================================
        
    //                                    3 hours in milliseconds.
    const next3HoursMs = now.getTime() + (3 * 60 * 60 * 1000) 

    for (let i = 0; i < tides.length - 1; i++) {
        
        const before = tides[i];
        const after = tides[i + 1];

        if (next3HoursMs >= before.dateTimeMs && next3HoursMs <= after.dateTimeMs) {

            // Applying linear interpolation formula to find current tide.
            const ratio = (next3HoursMs - before.dateTimeMs) / (after.dateTimeMs - before.dateTimeMs);
            const tideHeight = before.height + ratio * (after.height - before.height);

            // Drop some decimals. Example: 1.35356 -> 1.35
            return Math.round(tideHeight * 100) / 100;
        };
    };

    // Before the first tide → use the first tide's height
    if (next3HoursMs < tides[0].dateTimeMs) {
        return tides[0].height;

 
    // After the last tide → use the last tide's height
    } else {
        return tides[tides.length - 1].height;
    };
};
