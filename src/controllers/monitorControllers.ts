import axios from 'axios';

// Respective sea levels for next 4 hours.
export const getUpcomingTides = async(lat: number, lon: number): Promise<number[]> => {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=sea_level_height_msl&timezone=America/Recife&forecast_hours=4`;

    const response = await axios.get(url);

    if (response.status !== 200) {
        throw new Error(`Marine API error: ${response.status}`)
    }

    return response.data.hourly.sea_level_height_msl;
};

// Respective rains precipitations for next 4 hours.
export const getUpcomingRains = async(lat: number, lon: number): Promise<number[]> => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation&timezone=America/Recife&forecast_hours=4`
    const response = await axios.get(url);

    if (response.status !== 200) {
        throw new Error(`Rain API error: ${response.status}`)
    }

    return response.data.hourly.precipitation;
};  