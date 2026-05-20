import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import neighborhoodsOfficial from '../src/config/neighborhoods-official.json';

/**
 * Zone configuration: maps zone names to sensors and river basins
 * Structure: { cityName: { zoneName: { sensors: [...], basins: [...], lat, lng } } }
 */
const zoneConfig: Record<
  string,
  Record<string, { sensors: string[]; basins: string[]; lat: number; lng: number }>
> = {
  Recife: {
    'Centro (Ilhas e Arredores)': {
      sensors: ['[CEMADEN] Porto', '[APAC] Sede'],
      basins: ['Capibaribe'],
      lat: -8.054,
      lng: -34.863,
    },
    'Zona Norte (Eixo Tradicional)': {
      sensors: ['[CEMADEN] Compaz - Alto Sta. Terezinha [G]', '[CEMADEN] Torreão'],
      basins: ['Beberibe', 'Capibaribe'],
      lat: -8.015,
      lng: -34.893,
    },
    'Zona Noroeste (Eixo Casa Amarela e Morros)': {
      sensors: ['[APAC] UPA Nova Descoberta', '[APAC] Guabiraba'],
      basins: ['Capibaribe'],
      lat: -7.993,
      lng: -34.934,
    },
    'Zona Oeste (Eixo Caxangá)': {
      sensors: ['[CEMADEN] Barreira [G]', '[CEMADEN] Universidade Federal Rural de Pernambuco'],
      basins: ['Capibaribe'],
      lat: -8.021,
      lng: -34.956,
    },
    'Zona Sudoeste (Eixo Av. Recife e Abdias)': {
      sensors: ['[CEMADEN] San Martin', '[CEMADEN] Areias'],
      basins: ['Tejipió'],
      lat: -8.087,
      lng: -34.927,
    },
    'Zona Sul (Eixo Orla e Mascarenhas)': {
      sensors: ['[APAC] UPA Imbiribeira', '[CEMADEN] Pina', '[CEMADEN] Ibura'],
      basins: ['GL2'],
      lat: -8.115,
      lng: -34.885,
    },
  },
  Olinda: {
    'Sítio Histórico e Arredores': {
      sensors: ['[APAC] Ouro Preto'],
      basins: ['Capibaribe'],
      lat: -7.986,
      lng: -34.855,
    },
    'Orla Leste': {
      sensors: ['[CEMADEN] Espaço Ciencia'],
      basins: ['Capibaribe'],
      lat: -7.995,
      lng: -34.845,
    },
    'Fronteira Sudoeste (Com Recife)': {
      sensors: ['[APAC] Ouro Preto'],
      basins: ['Capibaribe'],
      lat: -8.005,
      lng: -34.865,
    },
    'Eixo Central e Oeste': {
      sensors: ['[APAC] Ouro Preto'],
      basins: ['Capibaribe'],
      lat: -8.010,
      lng: -34.880,
    },
    'Região dos Altos (Noroeste)': {
      sensors: ['[CEMADEN] Espaço Ciencia'],
      basins: ['Capibaribe'],
      lat: -8.000,
      lng: -34.870,
    },
  },
  'Jaboatão dos Guararapes': {
    'Jaboatão Centro (Leste e Interior)': {
      sensors: ['[CEMADEN] Engenho Velho [H]'],
      basins: ['Ipojuca', 'Capibaribe'],
      lat: -8.112,
      lng: -35.020,
    },
    'Cavaleiro e Oeste': {
      sensors: ['[CEMADEN] Alto Do Reservatório [G]'],
      basins: ['Capibaribe'],
      lat: -8.105,
      lng: -35.035,
    },
    'Curado (Noroeste)': {
      sensors: ['[CEMADEN] Alto Do Reservatório [G]'],
      basins: ['Capibaribe'],
      lat: -8.100,
      lng: -35.025,
    },
    'Muribeca (Eixo BR-101)': {
      sensors: ['[CEMADEN] Piedade'],
      basins: ['Ipojuca', 'Capibaribe'],
      lat: -8.120,
      lng: -35.035,
    },
    'Prazeres e Eixo Sul': {
      sensors: ['[CEMADEN] Piedade'],
      basins: ['GL2'],
      lat: -8.130,
      lng: -35.025,
    },
    'Litoral': {
      sensors: ['[CEMADEN] Piedade'],
      basins: ['GL2'],
      lat: -8.145,
      lng: -35.010,
    },
  },
  Paulista: {
    'Centro e Norte': {
      sensors: ['[CEMADEN] Janga'],
      basins: ['Capibaribe'],
      lat: -7.944,
      lng: -34.855,
    },
    'Eixo PE-15 e Oeste': {
      sensors: ['[APAC] Janga 2', 'Paratibe'],
      basins: ['Capibaribe'],
      lat: -7.950,
      lng: -34.870,
    },
    'Litoral': {
      sensors: ['[CEMADEN] Janga'],
      basins: ['Capibaribe'],
      lat: -7.935,
      lng: -34.840,
    },
  },
  'Cabo de Santo Agostinho': {
    'Sede e Vias de Acesso': {
      sensors: ['[APAC] Torrinha'],
      basins: ['Ipojuca'],
      lat: -8.143,
      lng: -34.930,
    },
    'Norte (Divisa Jaboatão)': {
      sensors: ['[CEMADEN] Pontes dos Carvalhos'],
      basins: ['Ipojuca', 'Capibaribe'],
      lat: -8.130,
      lng: -34.920,
    },
    'Sul e Oeste (Rodovias e Rural)': {
      sensors: ['[APAC] Charneca'],
      basins: ['Ipojuca'],
      lat: -8.155,
      lng: -34.940,
    },
    'Litoral Leste': {
      sensors: ['[CEMADEN] Pirapama [G]', '[CEMADEN] Enseada dos Corais'],
      basins: ['Sirinhaém'],
      lat: -8.160,
      lng: -34.905,
    },
  },
  Camaragibe: {
    'Centro e Arredores (Núcleo Histórico)': {
      sensors: ['[CEMADEN] Convento Carmelo [G]'],
      basins: ['Capibaribe'],
      lat: -8.037,
      lng: -34.966,
    },
    'Divisa com Recife (Zona Leste)': {
      sensors: ['[APAC] Jardim Primavera'],
      basins: ['Capibaribe'],
      lat: -8.030,
      lng: -34.955,
    },
    'Eixo Sul (Divisa com São Lourenço da Mata)': {
      sensors: ['[CEMADEN] Aldeia'],
      basins: ['Capibaribe'],
      lat: -8.045,
      lng: -34.975,
    },
    'Região dos Morros e Vales (Zona Oeste)': {
      sensors: ['[APAC] Jardim Primavera'],
      basins: ['Capibaribe'],
      lat: -8.040,
      lng: -34.985,
    },
    'Eixo Norte e Estrada de Aldeia (PE-027)': {
      sensors: ['[CEMADEN] Aldeia'],
      basins: ['Capibaribe'],
      lat: -8.025,
      lng: -34.960,
    },
  },
  Igarassu: {
    'Centro e Leste (Histórico e Litoral)': {
      sensors: ['[APAC] Alto do Céu'],
      basins: ['Capibaribe'],
      lat: -7.787,
      lng: -34.888,
    },
    'Sul (Divisa Abreu e Lima)': {
      sensors: ['[CEMADEN] Cruz de Rebouças 2'],
      basins: ['Goiana'],
      lat: -7.800,
      lng: -34.895,
    },
    'Oeste e Interior': {
      sensors: ['[APAC] Alto do Céu'],
      basins: ['Goiana', 'Capibaribe'],
      lat: -7.795,
      lng: -34.910,
    },
  },
  'Abreu e Lima': {
    'Centro e BR-101': {
      sensors: [],
      basins: ['Capibaribe'],
      lat: -7.895,
      lng: -34.942,
    },
    'Região de Caetés (Zona Oeste)': {
      sensors: [],
      basins: ['Capibaribe'],
      lat: -7.900,
      lng: -34.955,
    },
    'Área Rural e Norte': {
      sensors: [],
      basins: ['Capibaribe'],
      lat: -7.885,
      lng: -34.930,
    },
  },
  Ipojuca: {
    'Sede e Entorno': {
      sensors: ['[CEMADEN] Rurópolis'],
      basins: ['Ipojuca'],
      lat: -8.397,
      lng: -35.046,
    },
    'Leste (Rota do Mar)': {
      sensors: ['[APAC] Núcleo Maranhão'],
      basins: ['Ipojuca'],
      lat: -8.390,
      lng: -35.035,
    },
    'Litoral': {
      sensors: ['[APAC] IFPE'],
      basins: ['Ipojuca'],
      lat: -8.410,
      lng: -35.050,
    },
    'Sul e Rural': {
      sensors: ['[CEMADEN] Rurópolis'],
      basins: ['Ipojuca'],
      lat: -8.420,
      lng: -35.060,
    },
  },
  'São Lourenço da Mata': {
    'Centro e Bairros Vizinhos': {
      sensors: ['[CEMADEN] Rua dos Milagres'],
      basins: ['Capibaribe'],
      lat: -7.951,
      lng: -35.022,
    },
    'Eixo Norte e Noroeste (PE-090)': {
      sensors: ['[APAC] Chã da Tábua'],
      basins: ['Capibaribe'],
      lat: -7.940,
      lng: -35.030,
    },
    'Eixo Sul e Leste': {
      sensors: ['ETA Castelo Branco'],
      basins: ['Capibaribe'],
      lat: -7.960,
      lng: -35.010,
    },
    'Distritos Rurais': {
      sensors: ['ETA Castelo Branco'],
      basins: ['Capibaribe'],
      lat: -7.970,
      lng: -35.040,
    },
  },
  Itapissuma: {
    'Centro e Orla': {
      sensors: ['[APAC] Colégio Municipal'],
      basins: ['Capibaribe'],
      lat: -7.867,
      lng: -34.994,
    },
    'Oeste e Interior': {
      sensors: ['[APAC] Colégio Municipal'],
      basins: ['Capibaribe'],
      lat: -7.875,
      lng: -35.005,
    },
  },
  Moreno: {
    'Sede': {
      sensors: ['[APAC] Centro'],
      basins: ['Capibaribe'],
      lat: -8.061,
      lng: -35.050,
    },
    'Distritos': {
      sensors: ['[APAC] Bonança'],
      basins: ['Capibaribe'],
      lat: -8.070,
      lng: -35.060,
    },
  },
  'Ilha de Itamaracá': {
    'Centro (Pilar e Arredores)': {
      sensors: ['[APAC] Pilar'],
      basins: [],
      lat: -7.774,
      lng: -34.364,
    },
    'Litoral Norte': {
      sensors: ['[APAC] Pilar'],
      basins: [],
      lat: -7.760,
      lng: -34.350,
    },
    'Litoral Sul': {
      sensors: ['[APAC] Pilar'],
      basins: [],
      lat: -7.785,
      lng: -34.375,
    },
  },
  Goiana: {
    'Sede (Centro e Bairros)': {
      sensors: ['[CEMADEN] Centro', '[APAC] Ponta de Pedra'],
      basins: ['Goiana'],
      lat: -7.449,
      lng: -34.915,
    },
    'Litoral': {
      sensors: ['[APAC] [ETA Compesa]'],
      basins: ['Goiana'],
      lat: -7.435,
      lng: -34.900,
    },
    'Distritos Históricos e Rurais': {
      sensors: ['[CEMADEN] Centro'],
      basins: ['Goiana'],
      lat: -7.460,
      lng: -34.930,
    },
  },
  Araçoiaba: {
    'Centro e Bairros': {
      sensors: ['[APAC]'],
      basins: ['Goiana'],
      lat: -7.789,
      lng: -35.092,
    },
  },
};

async function main() {
  console.log('🌱 Seeding Recife Nimbus database...\n');

  let totalZones = 0;
  let totalNeighborhoods = 0;

  // Process each city from neighborhoods-official.json
  for (const cityName of Object.keys(neighborhoodsOfficial)) {
    const cityZones = (neighborhoodsOfficial as Record<string, Record<string, string[]>>)[cityName];

    // Ensure city exists
    const city = await prisma.city.upsert({
      where: { name: cityName },
      update: {},
      create: { name: cityName },
    });

    console.log(`\n📍 City: ${cityName}`);

    // Process each zone in the city
    for (const zoneName of Object.keys(cityZones)) {
      const neighborhoods = cityZones[zoneName];
      const config = zoneConfig[cityName]?.[zoneName];

      if (!config) {
        console.warn(`  ⚠️  No config found for zone: ${zoneName}`);
        continue;
      }

      // Create or update zone
      const zone = await prisma.zone.upsert({
        where: { name: zoneName },
        update: {
          latitude: config.lat,
          longitude: config.lng,
          rainSensorNames: config.sensors.filter(Boolean),
          riverBasins: config.basins.filter(Boolean),
          cityId: city.id,
        },
        create: {
          name: zoneName,
          latitude: config.lat,
          longitude: config.lng,
          rainSensorNames: config.sensors.filter(Boolean),
          riverBasins: config.basins.filter(Boolean),
          cityId: city.id,
        },
      });

      console.log(`  ✅ Zone: ${zoneName}`);
      console.log(`     • Sensors: ${config.sensors.filter(Boolean).length}`);
      console.log(`     • Basins: ${config.basins.filter(Boolean).length}`);

      // Upsert neighborhoods
      let neighborhoodCount = 0;
      for (const neighborhoodName of neighborhoods) {
        await prisma.neighborhood.upsert({
          where: {
            name_zoneId: {
              name: neighborhoodName.trim(),
              zoneId: zone.id,
            },
          },
          update: {},
          create: {
            name: neighborhoodName.trim(),
            zoneId: zone.id,
          },
        });
        neighborhoodCount++;
      }

      console.log(`     • Neighborhoods: ${neighborhoodCount}`);
      totalZones++;
      totalNeighborhoods += neighborhoodCount;
    }
  }

  // Print summary
  console.log(`\n✨ Seed completed!`);
  console.log(`   • Total zones: ${totalZones}`);
  console.log(`   • Total neighborhoods: ${totalNeighborhoods}`);

  // Print city summaries
  console.log(`\n📊 City summaries:`);
  const cities = await prisma.city.findMany({
    include: { zones: { include: { neighborhoods: true } } },
  });

  for (const city of cities) {
    const zones = city.zones ?? [];
    if (zones.length === 0) continue;

    const rainSet = new Set<string>();
    const basinSet = new Set<string>();
    let neighborhoodCount = 0;

    for (const zone of zones) {
      (zone.rainSensorNames ?? []).forEach((s) => rainSet.add(s));
      (zone.riverBasins ?? []).forEach((b) => basinSet.add(b));
      neighborhoodCount += (zone.neighborhoods ?? []).length;
    }

    console.log(`\n  ${city.name}`);
    console.log(`    Zones: ${zones.length}`);
    console.log(`    Unique sensors: ${rainSet.size}`);
    console.log(`    Unique basins: ${basinSet.size}`);
    console.log(`    Neighborhoods: ${neighborhoodCount}`);
  }
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
