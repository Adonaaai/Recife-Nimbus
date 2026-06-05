import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma.js';

interface EstruturaZona {
  lat: number;
  lng: number;
  neighborhoods: string[];
}

const geoZonesData: Record<string, Record<string, EstruturaZona>> = {
  "Abreu e Lima": {
    "Zona Central e BR-101": { lat: -7.895, lng: -34.942, neighborhoods: ["Centro", "Desterro", "Timbó"] },
    "Região de Caetés (Zona Oeste)": { lat: -7.900, lng: -34.955, neighborhoods: ["Alto da Bela Vista", "Caetés I", "Caetés II", "Caetés III", "Planalto"] },
    "Zona Rural e Norte": { lat: -7.885, lng: -34.930, neighborhoods: ["Fosfato", "Matinha"] }
  },
  "Araçoiaba": {
    "Zona Central e Adjacências": { lat: -7.789, lng: -35.092, neighborhoods: ["Centro", "Canaã", "Loteamento Flores", "Nova Araçoiaba"] }
  },
  "Cabo de Santo Agostinho": {
    "Distrito Sede e Acessos": { lat: -8.143, lng: -34.930, neighborhoods: ["Centro", "Destilaria", "São Francisco", "Torrinha"] },
    "Zona Norte (Divisa Jaboatão)": { lat: -8.130, lng: -34.920, neighborhoods: ["Ponte dos Carvalhos", "Pontezinha"] },
    "Zona Sul e Oeste (Rural e Rodovias)": { lat: -8.155, lng: -34.940, neighborhoods: ["Charneca", "Juçaral", "Manoel Lourenço"] },
    "Zona Litorânea (Leste)": { lat: -8.160, lng: -34.905, neighborhoods: ["Calhetas", "Enseada dos Corais", "Gaibu", "Itapuama", "Suape"] }
  },
  "Camaragibe": {
    "Zona Central (Núcleo Histórico)": { lat: -8.037, lng: -34.966, neighborhoods: ["Bairro Novo do Carmelo", "Centro", "Timbi", "Vila da Fábrica"] },
    "Zona Leste (Divisa com Recife)": { lat: -8.030, lng: -34.955, neighborhoods: ["Bairro dos Estados"] },
    "Eixo Sul (Divisa com São Lourenço)": { lat: -8.045, lng: -34.975, neighborhoods: ["Alberto Maia", "Santana"] },
    "Zona Oeste (Morros e Vales)": { lat: -8.040, lng: -34.985, neighborhoods: ["Jardim Primavera", "João Paulo II", "Santa Monica", "Santa Tereza", "São João e São Paulo", "Vale das Pedreiras"] },
    "Eixo Norte (Estrada de Aldeia - PE-027)": { lat: -8.025, lng: -34.960, neighborhoods: ["Aldeia de Baixo", "Aldeia dos Camarás", "Céu Azul", "Tabatinga", "Vera Cruz"] }
  },
  "Goiana": {
    "Distrito Sede (Urbano)": { lat: -7.449, lng: -34.915, neighborhoods: ["Centro", "Flexeiras", "Mutirão", "Nova Goiana"] },
    "Zona Litorânea": { lat: -7.435, lng: -34.900, neighborhoods: ["Carne de Vaca", "Pontas de Pedra"] },
    "Distritos Históricos e Rurais": { lat: -7.460, lng: -34.930, neighborhoods: ["São Lourenço", "Tejucupapo"] }
  },
  "Igarassu": {
    "Zona Centro-Leste (Histórico e Litoral)": { lat: -7.787, lng: -34.888, neighborhoods: ["Campina de Feira", "Centro"] },
    "Zona Sul (Divisa Abreu e Lima)": { lat: -7.800, lng: -34.895, neighborhoods: ["Agamenon Magalhães", "Cruz de Rebouças"] },
    "Zona Oeste e Interior": { lat: -7.795, lng: -34.910, neighborhoods: ["Inhamã", "Santo Antônio", "Três Ladeiras"] }
  },
  "Ilha de Itamaracá": {
    "Zona Central (Pilar e Entorno)": { lat: -7.774, lng: -34.364, neighborhoods: ["Baixa Verde", "Pilar", "Rio Âmbar"] },
    "Zona Litorânea Norte": { lat: -7.760, lng: -34.350, neighborhoods: ["Jaguaribe", "Sossego"] },
    "Zona Litorânea Sul": { lat: -7.785, lng: -34.375, neighborhoods: ["Forte Orange"] }
  },
  "Ipojuca": {
    "Distrito Sede e Entorno": { lat: -8.397, lng: -35.046, neighborhoods: ["Centro", "Rurópolis"] },
    "Distrito de Nossa Senhora do Ó": { lat: -8.390, lng: -35.035, neighborhoods: ["Nossa Senhora do Ó"] },
    "Zona Litorânea (Porto)": { lat: -8.410, lng: -35.050, neighborhoods: ["Maracaípe", "Muro Alto", "Porto de Galinhas"] },
    "Zona Sul e Rural": { lat: -8.420, lng: -35.060, neighborhoods: ["Camela", "Serrambi"] }
  },
  "Itapissuma": {
    "Zona Central e Orla": { lat: -7.867, lng: -34.994, neighborhoods: ["Camboa", "Centro", "Mangue Seco"] },
    "Zona Oeste e Interior": { lat: -7.875, lng: -35.005, neighborhoods: ["Grussaí", "Loteamento Cidade da Criança"] }
  },
  "Jaboatão dos Guararapes": {
    "Regional 1 - Jaboatão Centro": { lat: -8.112, lng: -35.020, neighborhoods: ["Bulhões", "Centro", "Engenho Velho", "Manassu", "Santo Aleixo", "Socorro", "Vila Rica", "Vista Alegre"] },
    "Regional 2 - Cavaleiro": { lat: -8.105, lng: -35.035, neighborhoods: ["Cavaleiro", "Dois Carneiros", "Jaboatãozinho", "Sucupira", "Zumbi do Pacheco"] },
    "Regional 3 - Curado": { lat: -8.100, lng: -35.025, neighborhoods: ["Curado I", "Curado II", "Curado III", "Curado IV", "Curado V"] },
    "Regional 4 - Muribeca": { lat: -8.120, lng: -35.035, neighborhoods: ["Marcos Freire", "Muribeca", "Muribeca dos Guararapes"] },
    "Regional 5 - Prazeres": { lat: -8.130, lng: -35.025, neighborhoods: ["Cajueiro Seco", "Guararapes", "Jardim Jordão", "Prazeres"] },
    "Regional 6 - Praias (Litoral)": { lat: -8.145, lng: -35.010, neighborhoods: ["Barra de Jangada", "Candeias", "Piedade"] }
  },
  "Moreno": {
    "Distrito Sede": { lat: -8.061, lng: -35.050, neighborhoods: ["Centro", "Oiteiro", "Pedreiras", "Valtelice"] },
    "Distrito de Bonança": { lat: -8.070, lng: -35.060, neighborhoods: ["Bonança"] }
  },
  "Olinda": {
    "Região Administrativa 1 - Histórica": { lat: -7.986, lng: -34.855, neighborhoods: ["Amaro Branco", "Amparo", "Bonsucesso", "Carmo", "Guadalupe", "Monte", "Santa Tereza", "Varadouro"] },
    "Região Administrativa 2 - Litorânea": { lat: -7.995, lng: -34.845, neighborhoods: ["Bairro Novo", "Casa Caiada", "Jardim Atlântico", "Rio Doce"] },
    "Região Administrativa 3 - Sul": { lat: -8.005, lng: -34.865, neighborhoods: ["Aguazinha", "Jardim Brasil", "Peixinhos", "Salgadinho", "Sítio Novo", "Vila Popular"] },
    "Região Administrativa 4 - Central e Oeste": { lat: -8.010, lng: -34.880, neighborhoods: ["Bultrins", "Fragoso", "Jatobá", "Ouro Preto", "São Benedito"] },
    "Região Administrativa 5 - Altos": { lat: -8.000, lng: -34.870, neighborhoods: ["Águas Compridas", "Alto da Bondade", "Alto da Conquista", "Alto da Nação", "Alto Novo Olinda", "Caixa d'Água", "Passarinho", "Tabajara"] }
  },
  "Paulista": {
    "Zona Central e Norte": { lat: -7.944, lng: -34.855, neighborhoods: ["Arthur Lundgren I", "Arthur Lundgren II", "Aurora", "Centro"] },
    "Eixo PE-15 e Oeste": { lat: -7.950, lng: -34.870, neighborhoods: ["Jardim Maranguape", "Jardim Paulista", "Maranguape I", "Maranguape II", "Paratibe"] },
    "Zona Litorânea": { lat: -7.935, lng: -34.840, neighborhoods: ["Conceição", "Janga", "Maria Farinha", "Pau Amarelo"] }
  },
  "Recife": {
    "RPA 1 - Centro": { lat: -8.054, lng: -34.863, neighborhoods: ["Bairro do Recife", "Boa Vista", "Cabanga", "Coelhos", "Derby", "Ilha do Leite", "Ilha Joana Bezerra", "Paissandu", "Santo Amaro", "Santo Antônio", "São José"] },
    "RPA 2 - Norte": { lat: -8.015, lng: -34.893, neighborhoods: ["Água Fria", "Arruda", "Beberibe", "Bomba do Hemetério", "Cajueiro", "Campina do Barreto", "Campo Grande", "Encruzilhada", "Espinheiro", "Fundão", "Hipódromo", "Linha do Tiro", "Ponto de Parada", "Porto da Madeira", "Rosarinho", "Torreão"] },
    "RPA 3 - Noroeste": { lat: -7.993, lng: -34.934, neighborhoods: ["Aflitos", "Alto do Mandu", "Alto José Bonifácio", "Alto José do Pinho", "Apipucos", "Brejo da Guabiraba", "Brejo de Beberibe", "Casa Amarela", "Casa Forte", "Córrego do Jenipapo", "Dois Irmãos", "Dois Unidos", "Graças", "Guabiraba", "Jaqueira", "Macaxeira", "Mangabeira", "Monteiro", "Nova Descoberta", "Parnamirim", "Passarinho", "Pau-Ferro", "Poço da Panela", "Santana", "Sítio dos Pintos", "Tamarineira", "Vasco da Gama"] },
    "RPA 4 - Oeste": { lat: -8.021, lng: -34.956, neighborhoods: ["Caxangá", "Cidade Universitária", "Cordeiro", "Engenho do Meio", "Ilha do Retiro", "Iputinga", "Madalena", "Prado", "Torre", "Torrões", "Várzea", "Zumbi"] },
    "RPA 5 - Sudoeste": { lat: -8.087, lng: -34.927, neighborhoods: ["Afogados", "Areias", "Barro", "Bongi", "Caçote", "Coqueiral", "Curado", "Estância", "Jardim São Paulo", "Jiquiá", "Mangueira", "Mustardinha", "San Martin", "Sancho", "Tejipió", "Totó"] },
    "RPA 6 - Sul": { lat: -8.115, lng: -34.885, neighborhoods: ["Boa Viagem", "Brasília Teimosa", "Cohab", "Ibura", "Imbiribeira", "Ipsep", "Jordão", "Pina"] }
  },
  "São Lourenço da Mata": {
    "Zona Central e Adjacências": { lat: -7.951, lng: -35.022, neighborhoods: ["Centro", "Capibaribe", "Parque Capibaribe", "Pixete"] },
    "Eixo Norte e Noroeste (PE-090)": { lat: -7.940, lng: -35.030, neighborhoods: ["Penedo", "Tiúma"] },
    "Eixo Sul e Leste": { lat: -7.960, lng: -35.010, neighborhoods: ["Muribara", "Várzea Fria"] },
    "Distritos Rurais": { lat: -7.970, lng: -35.040, neighborhoods: ["Lajes", "Matriz da Luz"] }
  }
};

function verificarSeEhLitoral(zoneName: string): boolean {
  const nomeLower = zoneName.toLowerCase();
  return nomeLower.includes('litorânea') || nomeLower.includes('litoral') || nomeLower.includes('orla') || nomeLower.includes('praia');
}

function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function main() {
  console.log('🌱 Iniciando processamento com estrutura final de zonas e bairros...');

  const chuvasPath = path.resolve(process.cwd(), 'met_monitoring_chuvas_pe01.json');
  let rainSensorFeatures: any[] = [];

  if (fs.existsSync(chuvasPath)) {
    const rawData = JSON.parse(fs.readFileSync(chuvasPath, 'utf-8'));
    rainSensorFeatures = rawData.features || [];
    console.log(`📦 Carregados ${rainSensorFeatures.length} sensores de chuva do JSON.`);
  } else {
    console.error(`❌ Arquivo JSON de chuvas não encontrado.`);
    process.exit(1);
  }

  console.log('🧹 Limpando tabelas para reconstrução estrutural...');
  await prisma.alertLog.deleteMany({});
  await prisma.cityAlertLog.deleteMany({});
  await prisma.neighborhood.deleteMany({});
  await prisma.zone.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('🔄 Tabelas limpas com sucesso.');

  const RAIO_MAXIMO_KM = 3.8;

  for (const [cityName, zones] of Object.entries(geoZonesData)) {
    console.log(`🏙️ Inserindo Cidade: ${cityName}`);
    const city = await prisma.city.create({ data: { name: cityName } });

    for (const [zoneName, zoneInfo] of Object.entries(zones)) {
      const nomeUnicoZona = `${cityName} - ${zoneName}`;
      const ehLitoral = verificarSeEhLitoral(zoneName);

      const sensoresVinculados = new Set<string>();

      // Cruzamento espacial por raio dinâmico
      for (const feature of rainSensorFeatures) {
        const attr = feature.attributes;
        if (!attr || attr.latitude === undefined || attr.longitude === undefined) continue;

        const distancia = calcularDistanciaKm(zoneInfo.lat, zoneInfo.lng, attr.latitude, attr.longitude);
        if (distancia <= RAIO_MAXIMO_KM && attr.nome) {
          sensoresVinculados.add(attr.nome);
        }
      }

      // Fallback espacial isolado por escopo de bloco
      if (sensoresVinculados.size === 0 && rainSensorFeatures.length > 0) {
        let sensorMaisProximo: any = null;
        let menorDistancia = Infinity;

        for (const feature of rainSensorFeatures) {
          const attr = feature.attributes;
          if (!attr || attr.latitude === undefined || attr.longitude === undefined) continue;

          const dist = calcularDistanciaKm(zoneInfo.lat, zoneInfo.lng, attr.latitude, attr.longitude);
          if (dist < menorDistancia) {
            menorDistancia = dist;
            sensorMaisProximo = attr;
          }
        }

        if (sensorMaisProximo?.nome) {
          sensoresVinculados.add(sensorMaisProximo.nome);
          console.log(`   ⚠️ Zona [${nomeUnicoZona}] adotou fallback: [${sensorMaisProximo.nome}] a ${menorDistancia.toFixed(2)}km.`);
        }
      }

      const sensoresFinais = Array.from(sensoresVinculados);

      // Criando a zona. ATENÇÃO: riverBasins inicializa vazio para o seed-river preencher depois!
      const zone = await prisma.zone.create({
        data: {
          name: nomeUnicoZona,
          isCoastal: ehLitoral,
          latitude: zoneInfo.lat,
          longitude: zoneInfo.lng,
          cityId: city.id,
          rainSensorNames: sensoresFinais,
          riverBasins: [] 
        }
      });

      if (zoneInfo.neighborhoods.length > 0) {
        await prisma.neighborhood.createMany({
          data: zoneInfo.neighborhoods.map(bairroNome => ({
            name: bairroNome,
            zoneId: zone.id
          }))
        });
      }
    }
  }

  console.log('✨ Seed principal finalizado!');
  console.log('🚀 IMPORTANTE: Agora rode "npx tsx prisma/seed-river.ts" para injetar as bacias!');
}

main()
  .catch((e) => {
    console.error('❌ Erro inesperado na execução:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });