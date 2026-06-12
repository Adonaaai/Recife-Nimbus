import axios from 'axios';

export const getForecastRainMmFunction = async (lat: number, lon: number): Promise<number> => {
    try {
        const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}&longitude=${lon}` +  // ← & here
            `&hourly=precipitation` +              // ← & here
            `&timezone=America%2FSao_Paulo`;
            
        const res = await axios.get(url, {timeout: 8000});
        
        // times[i] matches with rain[i]
        const times: string[] = res.data.hourly.time;
        const rain: number[] = res.data.hourly.precipitation;
        const nowMs = new Date().getTime();

        // Total rain of the next 3 hours.
        let total = 0
        // Index for the next 3 hours.
        let count = 0;

        for (let i = 0; i < times.length && count < 3; i++) {
            const timeMs = new Date(times[i] + '-03:00').getTime();
            if (timeMs >= nowMs) {
                // This time is in the future - add the rain to the total.
                total += rain[i];
                count++;
            };
        };

        // Return the total rain in mm, rounded to 2 decimal places.
        return Math.round(total * 100) / 100;

    } catch (err) {
        console.error(`[Rain] Error getting forecast rain mm: ${err}`);
        return 0;
    };
};

export const getForecastRainMm = async (lat: number, lon: number): Promise<number> => {
    await new Promise(res => setTimeout(res, 200));
    return getForecastRainMmFunction(lat, lon);
};
