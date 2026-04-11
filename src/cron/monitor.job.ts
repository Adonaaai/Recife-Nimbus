import { tideZones } from '../config/tideZones.ts';
import cron from 'node-cron';
import axios from 'axios';
import { getUpcomingTides, getUpcomingRains } from '../controllers/monitorControllers.ts'

export const monitorJob = async () => {
    console.log(`Recife-Nimbus Monitor initialized. Waiting for next interval...`);

    cron.schedule('*/15 * * * *', async () => {
        console.log(`\n${new Date().toISOString()} Starting regional check for flood risk in the next 3 hours.`);
        
        // ============== Flood risk 01: if (tide > 2.0m and rain >5mm/h) throws a flood risk alert. ===================
        for (const [ zoneName, zoneData] of Object.entries(tideZones)) {
            try {
                // tides returns [now, +1, +2, +3]
                const tides = await getUpcomingTides(zoneData.referenceCoordinate.lat, zoneData.referenceCoordinate.lon);
                const rains = await getUpcomingRains(zoneData.referenceCoordinate.lat, zoneData.referenceCoordinate.lon);

                let dangerHourOffset = -1;

                for (let i = 0; i < 4 ; i++) {
                    // If the the tide is higher than 2.0m and the rain is higher than 5mm/h(in the same hour)
                    if (tides[i] > 2.0 && rains[i] > 5.0) {// thrigger a new flood risk alert.  

                        // FUTURE: Send the alert to all neighborhoods in the region cities then all subscribed user of
                        // this neighborhood be alerted by the flood risk.
                        dangerHourOffset = i;
                        const timeMsg = dangerHourOffset === 0 ? "RIGHT NOW" : `in ${dangerHourOffset} hour(s)`;
                        console.log(`FLOOD RISK in ${zoneName.toUpperCase()} ${timeMsg}!`);
                        console.log(`     -> Tide: ${tides[dangerHourOffset]}m | Rain: ${rains[dangerHourOffset]}mm/h`);
                         
                        break;
                    }; 
                };

                if (dangerHourOffset === -1) {
                    console.log(`No high flood thriggered`);
                };   

            } catch (err) {
                console.error(`Error caught trying to check ${zoneName}:.\n${err}`);
            };
        };
    });
};