import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import axios from 'axios';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// RECIFE NEIGHBORHOODS (Optimized Centroids & RPA Groups)
const recifeNeighborhoods = [
    // RPA 1 - CENTRO (The Historic & Administrative Core)
    { name: "Recife Antigo", lat: -8.0631, lon: -34.8711, rpa: 1 },
    { name: "Boa Vista", lat: -8.0583, lon: -34.8858, rpa: 1 },
    { name: "Cabanga", lat: -8.0776, lon: -34.8891, rpa: 1 },
    { name: "Coelhos", lat: -8.0645, lon: -34.8924, rpa: 1 },
    { name: "Ilha do Leite", lat: -8.0654, lon: -34.8965, rpa: 1 },
    { name: "Ilha Joana Bezerra", lat: -8.0712, lon: -34.8943, rpa: 1 },
    { name: "Paissandu", lat: -8.0612, lon: -34.8923, rpa: 1 },
    { name: "Santo Amaro", lat: -8.0515, lon: -34.8790, rpa: 1 }, // Adjusted toward Cruz Cabugá hub
    { name: "Santo Antônio", lat: -8.0632, lon: -34.8778, rpa: 1 },
    { name: "São José", lat: -8.0678, lon: -34.8812, rpa: 1 },
    { name: "Soledade", lat: -8.0565, lon: -34.8878, rpa: 1 },
  
    // RPA 2 - NORTE (Traditional Residential & Commercial)
    { name: "Água Fria", lat: -8.0165, lon: -34.8872, rpa: 2 },
    { name: "Alto Santa Terezinha", lat: -8.0069, lon: -34.8965, rpa: 2 },
    { name: "Arruda", lat: -8.0232, lon: -34.8916, rpa: 2 },
    { name: "Beberibe", lat: -8.0101, lon: -34.8893, rpa: 2 },
    { name: "Bomba do Hemetério", lat: -8.0164, lon: -34.8979, rpa: 2 },
    { name: "Cajueiro", lat: -8.0187, lon: -34.8812, rpa: 2 },
    { name: "Campina do Barreto", lat: -8.0142, lon: -34.8789, rpa: 2 },
    { name: "Campo Grande", lat: -8.0324, lon: -34.8778, rpa: 2 },
    { name: "Encruzilhada", lat: -8.0378, lon: -34.8895, rpa: 2 },
    { name: "Fundão", lat: -8.0198, lon: -34.8712, rpa: 2 },
    { name: "Hipódromo", lat: -8.0312, lon: -34.8878, rpa: 2 },
    { name: "Linha do Tiro", lat: -8.0065, lon: -34.9012, rpa: 2 },
    { name: "Peixinhos", lat: -8.0165, lon: -34.8698, rpa: 2 }, 
    { name: "Ponto de Parada", lat: -8.0343, lon: -34.8812, rpa: 2 },
    { name: "Porto da Madeira", lat: -8.0112, lon: -34.8765, rpa: 2 },
    { name: "Rosarinho", lat: -8.0365, lon: -34.8965, rpa: 2 },
    { name: "Tamarineira", lat: -8.0312, lon: -34.8998, rpa: 2 },
    { name: "Torreão", lat: -8.0412, lon: -34.8843, rpa: 2 },
  
    // RPA 3 - NOROESTE (Upscale Residential & Hills)
    { name: "Aflitos", lat: -8.0402, lon: -34.8960, rpa: 3 },
    { name: "Alto do Mandu", lat: -8.0261, lon: -34.9254, rpa: 3 },
    { name: "Alto José Bonifácio", lat: -8.0135, lon: -34.9048, rpa: 3 },
    { name: "Alto José do Pinho", lat: -8.0227, lon: -34.9084, rpa: 3 },
    { name: "Apipucos", lat: -8.0179, lon: -34.9387, rpa: 3 },
    { name: "Brejo da Guabiraba", lat: -7.9865, lon: -34.9295, rpa: 3 },
    { name: "Brejo de Beberibe", lat: -8.0012, lon: -34.9184, rpa: 3 },
    { name: "Casa Amarela", lat: -8.0254, lon: -34.9132, rpa: 3 },
    { name: "Casa Forte", lat: -8.0332, lon: -34.9187, rpa: 3 },
    { name: "Córrego do Jenipapo", lat: -8.0054, lon: -34.9312, rpa: 3 },
    { name: "Derby", lat: -8.0567, lon: -34.8998, rpa: 3 },
    { name: "Dois Irmãos", lat: -8.0165, lon: -34.9465, rpa: 3 },
    { name: "Dois Unidos", lat: -7.9995, lon: -34.9101, rpa: 3 },
    { name: "Espinheiro", lat: -8.0432, lon: -34.8921, rpa: 3 },
    { name: "Graças", lat: -8.0465, lon: -34.9012, rpa: 3 },
    { name: "Guabiraba", lat: -7.9654, lon: -34.9432, rpa: 3 },
    { name: "Jaqueira", lat: -8.0343, lon: -34.9043, rpa: 3 },
    { name: "Macaxeira", lat: -8.0143, lon: -34.9287, rpa: 3 },
    { name: "Mangabeira", lat: -8.0198, lon: -34.9154, rpa: 3 },
    { name: "Monteiro", lat: -8.0265, lon: -34.9212, rpa: 3 },
    { name: "Morro da Conceição", lat: -8.0212, lon: -34.9123, rpa: 3 },
    { name: "Nova Descoberta", lat: -8.0087, lon: -34.9232, rpa: 3 },
    { name: "Parnamirim", lat: -8.0312, lon: -34.9087, rpa: 3 },
    { name: "Passarinho", lat: -7.9812, lon: -34.9212, rpa: 3 },
    { name: "Pau-Ferro", lat: -7.9612, lon: -34.9612, rpa: 3 },
    { name: "Poço da Panela", lat: -8.0287, lon: -34.9198, rpa: 3 },
    { name: "Santana", lat: -8.0287, lon: -34.9243, rpa: 3 },
    { name: "Sítio dos Pintos", lat: -8.0087, lon: -34.9543, rpa: 3 },
    { name: "Vasco da Gama", lat: -8.0178, lon: -34.9165, rpa: 3 },
  
    // RPA 4 - OESTE (Academic & Transit Hub)
    { name: "Caxangá", lat: -8.0365, lon: -34.9621, rpa: 4 },
    { name: "Cidade Universitária", lat: -8.0512, lon: -34.9498, rpa: 4 },
    { name: "Cordeiro", lat: -8.0542, lon: -34.9312, rpa: 4 },
    { name: "Engenho do Meio", lat: -8.0543, lon: -34.9432, rpa: 4 },
    { name: "Ilha do Retiro", lat: -8.0612, lon: -34.9078, rpa: 4 },
    { name: "Iputinga", lat: -8.0412, lon: -34.9412, rpa: 4 },
    { name: "Madalena", lat: -8.0543, lon: -34.9132, rpa: 4 },
    { name: "Prado", lat: -8.0612, lon: -34.9132, rpa: 4 },
    { name: "Torre", lat: -8.0478, lon: -34.9143, rpa: 4 },
    { name: "Torrões", lat: -8.0587, lon: -34.9398, rpa: 4 },
    { name: "Várzea", lat: -8.0491, lon: -34.9581, rpa: 4 }, // Optimized to neighborhood center
    { name: "Zumbi", lat: -8.0512, lon: -34.9212, rpa: 4 },
  
    // RPA 5 - SUDOESTE (Industrial & Residential Mix)
    { name: "Afogados", lat: -8.0784, lon: -34.9095, rpa: 5 },
    { name: "Areias", lat: -8.0872, lon: -34.9284, rpa: 5 },
    { name: "Barro", lat: -8.0934, lon: -34.9472, rpa: 5 },
    { name: "Bongi", lat: -8.0664, lon: -34.9192, rpa: 5 },
    { name: "Caçote", lat: -8.1012, lon: -34.9288, rpa: 5 },
    { name: "Coqueiral", lat: -8.0845, lon: -34.9548, rpa: 5 },
    { name: "Curado", lat: -8.0754, lon: -34.9698, rpa: 5 },
    { name: "Estância", lat: -8.0812, lon: -34.9232, rpa: 5 },
    { name: "Jardim São Paulo", lat: -8.0787, lon: -34.9398, rpa: 5 },
    { name: "Jiquiá", lat: -8.0743, lon: -34.9298, rpa: 5 },
    { name: "Mangueira", lat: -8.0812, lon: -34.9143, rpa: 5 },
    { name: "Mustardinha", lat: -8.0712, lon: -34.9165, rpa: 5 },
    { name: "San Martin", lat: -8.0687, lon: -34.9343, rpa: 5 },
    { name: "Sancho", lat: -8.0849, lon: -34.9625, rpa: 5 },
    { name: "Tejipió", lat: -8.0887, lon: -34.9643, rpa: 5 },
    { name: "Totó", lat: -8.0932, lon: -34.9698, rpa: 5 },
  
    // RPA 6 - SUL (Beachfront & High Density)
    { name: "Boa Viagem", lat: -8.1132, lon: -34.8931, rpa: 6 }, // Optimized to "Segundo Jardim" area
    { name: "Brasília Teimosa", lat: -8.0855, lon: -34.8732, rpa: 6 },
    { name: "Cohab", lat: -8.1212, lon: -34.9432, rpa: 6 },
    { name: "Ibura", lat: -8.1187, lon: -34.9498, rpa: 6 },
    { name: "Imbiribeira", lat: -8.1065, lon: -34.9112, rpa: 6 },
    { name: "Ipsep", lat: -8.1098, lon: -34.9212, rpa: 6 },
    { name: "Jordão", lat: -8.1343, lon: -34.9343, rpa: 6 },
    { name: "Pina", lat: -8.0932, lon: -34.8843, rpa: 6 }
  ];

  // 2. RMR CITIES (Cleaned for Geocoding Precision)
const rmrCities = [
    {
      city: "Olinda",
      neighborhoods: [
        "Águas Compridas", "Aguazinha", "Alto da Bondade", "Alto da Conquista", "Alto da Nação", 
        "Alto Jardim Conquista", "Alto Nova Olinda", "Alto Sol Nascente", "Amaro Branco", "Amparo", 
        "Bairro Novo", "Bonsucesso", "Bultrins", "Caixa D'água", "Carmo", "Casa Caiada", 
        "Cidade Tabajara", "Córrego do Abacaxi", "Fragoso", "Guadalupe", "Jardim Atlântico", 
        "Jardim Brasil", "Jardim Fragoso", "Jatobá", "Milagres", "Monte", "Ouro Preto", 
        "Passarinho", "Peixinhos", "Rio Doce", "Salgadinho", "Santa Tereza", "São Benedito", 
        "Sapucaia", "Sítio Novo", "Varadouro", "Vila Popular"
      ]
    },
    {
      city: "Jaboatão dos Guararapes",
      neighborhoods: [
        "Barra de Jangada", "Cajueiro Seco", "Candeias", "Guararapes", "Piedade", "Prazeres", 
        "Comportas", "Marcos Freire", "Muribeca", "Bulhões", "Jaboatão Centro", "Engenho Velho", 
        "Floriano", "Manassu", "Muribequinha", "Santana", "Santo Aleixo", "Vargem Fria", 
        "Vila Rica", "Vista Alegre", "Cavaleiro", "Dois Carneiros", "Socorro", "Sucupira", 
        "Zumbi do Pacheco", "Curado I", "Curado II", "Curado III", "Curado IV", "Curado V", "Jardim Jordão"
      ]
    },
    {
      city: "Paulista",
      neighborhoods: [
        "Artur Lundgren I", "Artur Lundgren II", "Aurora", "Centro", "Engenho Maranguape", "Fragoso", 
        "Jaguarana", "Jaguaribe", "Janga", "Jardim Maranguape", "Jardim Paulista", "Maranguape I", 
        "Maranguape II", "Maria Farinha", "Mirueira", "Nobre", "Nossa Senhora da Conceição", 
        "Nossa Senhora do Ó", "Pau Amarelo", "Poty", "Vila Torres Galvão"
      ]
    },
    {
      city: "Cabo de Santo Agostinho",
      neighborhoods: [
        "Ponte dos Carvalhos", "São Francisco", "Cohab", "Malaquias", "Engenho Ilha", "Charneca", 
        "Pontezinha", "Gaibu", "Centro", "Garapu", "Charnequinha", "Pirapama", "Santo Inácio", 
        "Bom Conselho", "Enseada dos Corais", "Rosário", "Distrito Industrial Diper", 
        "Juçaral", "Suape", "Destilaria", "Paiva", "Itapoama"
      ]
    },
    {
      city: "Camaragibe",
      neighborhoods: [
        "Alberto Maia", "Aldeia", "Aldeia de Baixo", "Alto da Boa Vista", "Alto Santo Antônio", 
        "Areeiro", "Bairro dos Estados", "Bairro Novo do Carmelo", "Borralho", "Céu Azul", 
        "Centro", "Estação Nova", "Jardim Primavera", "João Paulo II", "Nazaré", "Oitenta", 
        "Santana", "Santa Mônica", "Santa Tereza", "São João e São Paulo", "Tabatinga", 
        "Timbí", "Vale das Pedreiras", "Vera Cruz", "Viana", "Vila da Fábrica", "Vila da Inabi"
      ]
    },
    {
      city: "Igarassu",
      neighborhoods: [
        "Agamenon Magalhães", "Alto do Céu", "Ana de Albuquerque", "Bela Vista", "Bonfim", 
        "Campina de Feira", "Centro", "Cruz do Rebouças", "Inhamã", "Jabacó", 
        "Jardim Boa Sorte", "Monjope", "Pancó", "Santa Luzia", "Santa Rita", 
        "Santo Antônio", "Saramandaia", "Sítio dos Marcos", "Tabatinga", "Triunfo", "Umbura"
      ]
    },
    {
      city: "Abreu e Lima",
      neighborhoods: [
        "Alto da Bela Vista", "Alto São Miguel", "Caetés I", "Caetés II", "Caetés III", 
        "Caetés Velho", "Centro", "Desterro", "Fosfato", "Jardim Caetés", "Matinha", 
        "Planalto", "Timbó", "Chã de Cruz"
      ]
    },
    {
      city: "Ipojuca",
      neighborhoods: [
        "Centro", "Camela", "Nossa Senhora do Ó", "Porto de Galinhas", "Maracaipe", 
        "Muro Alto", "Cupe", "Serrambi", "Toquinho", "Canoas", "Jagatá", "Salgado", 
        "São Miguel", "Enseada de Serrambi", "Merepe"
      ]
    },
    {
      city: "São Lourenço da Mata",
      neighborhoods: [
        "Capibaribe", "Centro", "Chã da Tábua", "Muribara", "Nova Tiúma", 
        "Parque Capibaribe", "Penedo", "Pixete", "Tiúma"
      ]
    },
    {
      city: "Itapissuma",
      neighborhoods: [
        "Botafogo", "Centro", "Mangabeira", "Cidade Criança", "Cidade Industrial", 
        "Conceição", "Cajueiro"
      ]
    },
    {
      city: "Moreno",
      neighborhoods: [
        "Bela Vista", "Bonança", "Centro", "Cercado Grande", "Cidade de Deus", 
        "João Paulo II", "Mangueira", "Nossa Senhora da Conceição", "Novo Horizonte", 
        "Olaria", "Parque dos Eucaliptos", "Souza Leão", "Vila Holandesa"
      ]
    },
    {
      city: "Ilha de Itamaracá",
      neighborhoods: [
        "Pilar", "Jaguaribe", "Quatro Cantos", "Baixa Verde", "Forno da Cal", 
        "Enseada dos Golfinhos", "Rio d'Água", "Vila Velha"
      ]
    },
    {
      city: "Araçoiaba",
      neighborhoods: [
        "Centro", "Vila Canaã", "Canaã", "Loteamento Primavera"
      ]
    },
    {
      city: "Goiana",
      neighborhoods: [
        "Centro", "Tejucupapo", "Ponta de Pedras", "Carne de Vaca", "Atapuz", "Flexeiras"
      ]
    }
  ];


async function getCoordinates(neighborhood: string, city: string) {
  try {
    const queries = [
      `${neighborhood}, ${city}, Pernambuco, Brazil`,
      `Bairro ${neighborhood}, ${city}, Pernambuco, Brazil`,
      `${neighborhood} - ${city}, Pernambuco, Brazil`,
      // Fallback for generic/unknown neighborhood names (e.g. "Centro")
      `${city}, Pernambuco, Brazil`,
    ];

    for (const query of queries) {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'RecifeNimbus/1.0' },
      });

      if (response.status !== 200) continue;

      const first = response.data?.[0];
      if (!first?.lat || !first?.lon) continue;

      const latitude = Number.parseFloat(first.lat);
      const longitude = Number.parseFloat(first.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

      return { latitude, longitude };
    }

    return null;

  } catch (err) {
    console.error('Error fetching coordinates:', err);
    return null;
  };
}

async function main() {
  // STEP B: Process the rest of the RMR Cities via API
  console.log('📡 Fetching coordinates for the rest of RMR. This will take about 5-10 minutes...');
  for (const cityData of rmrCities) {
    console.log(`\n🏙️ Processing City: ${cityData.city}`);

    for (const neighborhood of cityData.neighborhoods) {
      const coords = await getCoordinates(neighborhood, cityData.city);

      if (coords) {
        await prisma.neighborhood.upsert({
          where: { name_city: { name: neighborhood, city: cityData.city } },
          update: { latitude: coords.latitude, longitude: coords.longitude },
          create: {
            name: neighborhood,
            city: cityData.city,
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
        });
        console.log(`  ✅ Upserted: ${neighborhood} (${coords.latitude}, ${coords.longitude})`);
      } else {
        console.log(`  ⚠️ Coordinates not found for: ${neighborhood}`);
      }

      // CRITICAL: Wait 1.5 seconds before making the next API call to avoid getting IP banned
      await sleep(1500);
    }
  }

console.log('\n✨ Database successfully seeded with full RMR data!');
};

main()
  .catch((err) => {
    console.error('A fatal error occurred during seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });