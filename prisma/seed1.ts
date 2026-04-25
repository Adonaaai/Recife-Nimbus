import 'dotenv/config';
import { prisma } from '../src/lib/prisma.ts';

const recifeZones = [
  {
    name: 'Centro (RPA 1)',
    latitude: -8.054,
    longitude: -34.863,
    // Sensores mapeados via JSON APAC
    rainSensorNames: ['[CEMADEN] Porto', '[APAC] Sede'], 
    riverBasins: ['Capibaribe'],
    neighborhoods: [
      'Recife Antigo', 'Boa Vista', 'Cabanga', 'Coelhos', 'Ilha do Leite', 
      'Ilha Joana Bezerra', 'Paissandu', 'Santo Amaro', 'Santo Antônio', 
      'São José', 'Soledade'
    ]
  },
  {
    name: 'Norte (RPA 2)',
    latitude: -8.015,
    longitude: -34.893,
    // Sensores mapeados via JSON APAC
    rainSensorNames: ['[CEMADEN] Compaz - Alto Sta. Terezinha [G]', '[CEMADEN] Torreão'], 
    riverBasins: ['Beberibe', 'Capibaribe'],
    neighborhoods: [
      'Água Fria', 'Alto Santa Terezinha', 'Arruda', 'Beberibe', 'Bomba do Hemetério', 
      'Cajueiro', 'Campina do Barreto', 'Campo Grande', 'Encruzilhada', 'Fundão', 
      'Hipódromo', 'Linha do Tiro', 'Peixinhos', 'Ponto de Parada', 'Porto da Madeira', 
      'Rosarinho', 'Tamarineira', 'Torreão'
    ]
  },
  {
    name: 'Noroeste (RPA 3)',
    latitude: -7.993,
    longitude: -34.934,
    // Sensores mapeados via JSON APAC
    rainSensorNames: ['[APAC] UPA Nova Descoberta', '[APAC] Guabiraba'], 
    riverBasins: ['Capibaribe'],
    neighborhoods: [
      'Aflitos', 'Alto do Mandu', 'Alto José Bonifácio', 'Alto José do Pinho', 'Apipucos', 
      'Brejo da Guabiraba', 'Brejo de Beberibe', 'Casa Amarela', 'Casa Forte', 
      'Córrego do Jenipapo', 'Derby', 'Dois Irmãos', 'Dois Unidos', 'Espinheiro', 
      'Graças', 'Guabiraba', 'Jaqueira', 'Macaxeira', 'Mangabeira', 'Monteiro', 
      'Morro da Conceição', 'Nova Descoberta', 'Parnamirim', 'Passarinho', 'Pau-Ferro', 
      'Poço da Panela', 'Santana', 'Sítio dos Pintos', 'Vasco da Gama'
    ]
  },
  {
    name: 'Oeste (RPA 4)',
    latitude: -8.021,
    longitude: -34.956,
    // Sensores mapeados via JSON APAC (Várzea/UFRPE/Barreira)
    rainSensorNames: ['[CEMADEN] Barreira [G]', '[CEMADEN] Universidade Federal Rural de Pernambuco'], 
    riverBasins: ['Capibaribe'],
    neighborhoods: [
      'Caxangá', 'Cidade Universitária', 'Cordeiro', 'Engenho do Meio', 'Ilha do Retiro', 
      'Iputinga', 'Madalena', 'Prado', 'Torre', 'Torrões', 'Várzea', 'Zumbi'
    ]
  },
  {
    name: 'Sudoeste (RPA 5)',
    latitude: -8.087,
    longitude: -34.927,
    // Sensores mapeados via JSON APAC
    rainSensorNames: ['[CEMADEN] San Martin', '[CEMADEN] Areias'], 
    riverBasins: ['Tejipió'],
    neighborhoods: [
      'Afogados', 'Areias', 'Barro', 'Bongi', 'Caçote', 'Coqueiral', 'Curado', 
      'Estância', 'Jardim São Paulo', 'Jiquiá', 'Mangueira', 'Mustardinha', 
      'San Martin', 'Sancho', 'Tejipió', 'Totó'
    ]
  },
  {
    name: 'Sul (RPA 6)',
    latitude: -8.115,
    longitude: -34.885,
    // Sensores mapeados via JSON APAC
    rainSensorNames: ['[APAC] UPA Imbiribeira', '[CEMADEN] Pina', '[CEMADEN] Ibura'], 
    riverBasins: ['GL2'],
    neighborhoods: [
      'Boa Viagem', 'Brasília Teimosa', 'Cohab', 'Ibura', 'Imbiribeira', 'Ipsep', 
      'Jordão', 'Pina'
    ]
  }
];

async function main() {
  console.log('🌱 Iniciando o Seed do Banco de Dados (Recife MVP)...');

  // 1. Garante que a Cidade existe
  const recifeCity = await prisma.city.upsert({
    where: { name: 'Recife' },
    update: {},
    create: { name: 'Recife' },
  });

  // 2. Itera sobre as Zonas (RPAs)
  for (const zoneData of recifeZones) {
    const zoneFullId = `Recife - ${zoneData.name}`;
    console.log(`📍 Processando Zona: ${zoneFullId}`);

    await prisma.zone.upsert({
      where: { name: zoneFullId },
      update: {
        latitude: zoneData.latitude,
        longitude: zoneData.longitude,
        rainSensorNames: zoneData.rainSensorNames,
        riverBasins: zoneData.riverBasins,
      },
      create: {
        name: zoneFullId,
        latitude: zoneData.latitude,
        longitude: zoneData.longitude,
        rainSensorNames: zoneData.rainSensorNames,
        riverBasins: zoneData.riverBasins,
        cityId: recifeCity.id,
        neighborhoods: {
          create: zoneData.neighborhoods.map(bairro => ({
            name: bairro
          }))
        }
      }
    });
    console.log(`  ✅ ${zoneData.rainSensorNames.length} sensores vinculados.`);
  }

  console.log('\n✨ Seed concluído com sucesso!');
}

main()
  .catch((err) => {
    console.error('❌ Erro fatal no seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });