import { getEtfFlows } from '@/lib/api';
import { GoldETFWorldSection } from './GoldETFWorldSection';

export default async function GoldETFWorldSectionServer() {
  const etfData = await getEtfFlows(24);

  if (!etfData || !etfData.points || etfData.points.length === 0) {
    return null;
  }

  return (
    <GoldETFWorldSection 
      data={etfData.points} 
      source={etfData.source} 
    />
  );
}
