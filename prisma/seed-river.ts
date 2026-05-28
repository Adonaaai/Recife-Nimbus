import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma.js';

// Função clássica do cálculo de Haversine para distância em km
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
  console.log('🌊 Iniciando script de vinculo cirúrgico de bacias hidrográficas...');

  // 1. Carregar arquivo JSON de monitoramento de rios
  const riosPath = path.resolve(process.cwd(), 'mon_rivel_rios_pe01.json');
  if (!fs.existsSync(riosPath)) {
    console.error(`❌ Arquivo JSON de rios não encontrado em: ${riosPath}`);
    process.exit(1);
  }

  const rawDataRios = JSON.parse(fs.readFileSync(riosPath, 'utf-8'));
  const riverFeatures = rawDataRios.features || [];
  console.log(`📦 Carregados ${riverFeatures.length} pontos de monitoramento de rios do JSON.`);

  // 2. Buscar todas as zonas cadastradas no banco de dados
  const zonasExistentes = await prisma.zone.findMany({
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
    }
  });

  console.log(`🔍 Encontradas ${zonasExistentes.length} zonas no banco de dados para analisar.`);

  // Configuração de raio máximo para considerar que a zona está sob influência do rio/bacia
  const RAIO_MAX_RIOS_KM = 4.5;
  let zonasAtualizadas = 0;

  // 3. Processar cada zona e cruzar dados geograficamente
  for (const zona of zonasExistentes) {
    const baciasEncontradas = new Set<string>();

    for (const riverFeature of riverFeatures) {
      const attr = riverFeature.attributes;
      if (!attr || attr.latitude === undefined || attr.longitude === undefined) continue;

      const distancia = calcularDistanciaKm(zona.latitude, zona.longitude, attr.latitude, attr.longitude);

      // Se a estação de rio está dentro do raio aceitável da zona urbana
      if (distancia <= RAIO_MAX_RIOS_KM && attr.namebasin) {
        const nomeBaciaUniforme = attr.namebasin.trim();
        if (nomeBaciaUniforme) {
          baciasEncontradas.add(nomeBaciaUniforme);
        }
        
      }
    }

    const baciasFinais = Array.from(baciasEncontradas);

    // 4. Executar o update cirúrgico apenas no campo riverBasins da tabela Zone
    await prisma.zone.update({
      where: { id: zona.id },
      data: {
        riverBasins: baciasFinais
      }
    });

    zonasAtualizadas++;
    if (baciasFinais.length > 0) {
      console.log(`   ✅ [${zona.name}] vinculada às bacias: [${baciasFinais.join(', ')}]`);
    } else {
      console.log(`   🫙 [${zona.name}] sem rios de monitoramento próximos -> Array vazio [].`);
    }
  }

  console.log('✏️ Aplicando bacias hidrográficas manuais para zonas sem telemetria próxima...');

  const correcoes = [
    { termo: 'Recife - RPA 1', basins: ['Capibaribe'] },
    { termo: 'Recife - RPA 2', basins: ['Capibaribe'] },
    { termo: 'Recife - RPA 3', basins: ['Capibaribe'] },
    { termo: 'Recife - RPA 4', basins: ['Capibaribe'] },
    { termo: 'Recife - RPA 5', basins: ['Capibaribe'] },
    { termo: 'Recife - RPA 6', basins: [] },
    { termo: 'Camaragibe', basins: ['Capibaribe'] },
    { termo: 'São Lourenço da Mata', basins: ['Capibaribe'] },
    { termo: 'Olinda', basins: [] },
    { termo: 'Paulista - Eixo PE-15', basins: ['Paratibe'] },
    { termo: 'Paulista - Zona Central', basins: ['Paratibe'] },
    { termo: 'Moreno - Distrito Sede', basins: ['GL2'] }, // Mantendo 'GL2' que representa o Rio Jaboatão no seu JSON
    { termo: 'Cabo de Santo Agostinho', basins: [] },
    { termo: 'Ipojuca', basins: ['Ipojuca'] },
    { termo: 'Goiana', basins: ['Goiana'] },
    { termo: 'Abreu e Lima', basins: [] },
    { termo: 'Igarassu', basins: [] },
    { termo: 'Itapissuma', basins: [] },
  ];

  for (const item of correcoes) {
    // Busca todas as zonas que contenham o termo no nome (ex: "Recife - RPA 1 - Centro" vai bater em "Recife - RPA 1")
    const zonasAfetadas = await prisma.zone.findMany({
      where: {
        name: {
          contains: item.termo
        }
      },
      select: { id: true, name: true, riverBasins: true }
    });

    for (const zona of zonasAfetadas) {
      // Evita sobreescrever se a bacia correta já estiver lá de alguma forma
      const novasBacias = Array.from(new Set([...zona.riverBasins, ...item.basins]));

      await prisma.zone.update({
        where: { id: zona.id },
        data: { riverBasins: novasBacias }
      });

      console.log(`   ⚡ [${zona.name}] forçado manualmente para: [${novasBacias.join(', ')}]`);
    }
  }

  console.log(`\n✨ Sucesso! ${zonasAtualizadas} zonas tiveram seus mapeamentos de bacias atualizados com precisão.`);
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.error('❌ Erro durante a atualização das bacias:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();