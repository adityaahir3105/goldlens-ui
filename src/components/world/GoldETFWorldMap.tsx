'use client';

import { useState, useEffect, useMemo } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { DisplayFlowPoint, DisplayRegion } from '@/lib/types';

const WORLD_ATLAS_URL = 'https://unpkg.com/world-atlas@2/countries-110m.json';

const ISO_NUMERIC_TO_REGION: Record<string, DisplayRegion> = {
  '156': 'China',
  '356': 'India',
  '643': 'Russia',
  '840': 'North America',
  '124': 'North America',
  '484': 'North America',
  '826': 'Europe',
  '276': 'Europe',
  '250': 'Europe',
  '380': 'Europe',
  '724': 'Europe',
  '620': 'Europe',
  '528': 'Europe',
  '056': 'Europe',
  '756': 'Europe',
  '040': 'Europe',
  '752': 'Europe',
  '578': 'Europe',
  '208': 'Europe',
  '246': 'Europe',
  '372': 'Europe',
  '616': 'Europe',
  '203': 'Europe',
  '300': 'Europe',
  '348': 'Europe',
  '642': 'Europe',
  '100': 'Europe',
  '703': 'Europe',
  '191': 'Europe',
  '705': 'Europe',
  '440': 'Europe',
  '428': 'Europe',
  '233': 'Europe',
  '442': 'Europe',
  '352': 'Europe',
  '804': 'Europe',
  '112': 'Europe',
  '688': 'Europe',
  '008': 'Europe',
  '807': 'Europe',
  '499': 'Europe',
  '070': 'Europe',
  '498': 'Europe',
  '392': 'Rest of Asia',
  '410': 'Rest of Asia',
  '158': 'Rest of Asia',
  '702': 'Rest of Asia',
  '344': 'Rest of Asia',
  '764': 'Rest of Asia',
  '458': 'Rest of Asia',
  '360': 'Rest of Asia',
  '608': 'Rest of Asia',
  '704': 'Rest of Asia',
  '586': 'Rest of Asia',
  '050': 'Rest of Asia',
  '144': 'Rest of Asia',
  '104': 'Rest of Asia',
  '524': 'Rest of Asia',
  '116': 'Rest of Asia',
  '418': 'Rest of Asia',
  '496': 'Rest of Asia',
  '398': 'Rest of Asia',
  '860': 'Rest of Asia',
  '795': 'Rest of Asia',
  '417': 'Rest of Asia',
  '762': 'Rest of Asia',
  '004': 'Rest of Asia',
  '364': 'Rest of Asia',
  '368': 'Rest of Asia',
  '682': 'Rest of Asia',
  '784': 'Rest of Asia',
  '634': 'Rest of Asia',
  '414': 'Rest of Asia',
  '048': 'Rest of Asia',
  '512': 'Rest of Asia',
  '887': 'Rest of Asia',
  '400': 'Rest of Asia',
  '422': 'Rest of Asia',
  '760': 'Rest of Asia',
  '376': 'Rest of Asia',
  '792': 'Rest of Asia',
  '031': 'Rest of Asia',
  '268': 'Rest of Asia',
  '051': 'Rest of Asia',
};

function getRegionForNumericISO(id: string): DisplayRegion {
  return ISO_NUMERIC_TO_REGION[id] || 'Other';
}

function getFlowColor(netFlow: number | null): string {
  if (netFlow === null || netFlow === undefined || isNaN(netFlow)) {
    return '#374151';
  }
  if (netFlow > 0) return '#22c55e';
  if (netFlow < 0) return '#ef4444';
  return '#374151';
}

interface GoldETFWorldMapProps {
  regionData: Map<DisplayRegion, DisplayFlowPoint>;
  onRegionHover: (region: DisplayRegion | null, data: DisplayFlowPoint | null) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  countryName: string;
  region: DisplayRegion;
  holdings: number | null;
  netFlow: number | null;
}

interface CountryFeature {
  type: 'Feature';
  id: string;
  properties: { name: string };
  geometry: GeoJSON.Geometry;
}

export function GoldETFWorldMap({ regionData, onRegionHover }: GoldETFWorldMapProps) {
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    countryName: '',
    region: 'Other',
    holdings: null,
    netFlow: null,
  });

  useEffect(() => {
    fetch(WORLD_ATLAS_URL)
      .then((res) => res.json())
      .then((topology: Topology<{ countries: GeometryCollection<{ name: string }> }>) => {
        const geojson = feature(topology, topology.objects.countries);
        setCountries(geojson.features as CountryFeature[]);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load world atlas:', err);
        setLoading(false);
      });
  }, []);

  const projection = useMemo(() => {
    return geoNaturalEarth1()
      .scale(160)
      .translate([450, 250]);
  }, []);

  const pathGenerator = useMemo(() => {
    return geoPath().projection(projection);
  }, [projection]);

  const handleMouseMove = (
    e: React.MouseEvent,
    country: CountryFeature,
    region: DisplayRegion,
    data: DisplayFlowPoint | null
  ) => {
    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      countryName: country.properties.name || 'Unknown',
      region,
      holdings: data?.holdingsTonnes ?? null,
      netFlow: data?.netFlowTonnes ?? null,
    });
    onRegionHover(region, data);
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
    onRegionHover(null, null);
  };

  if (loading) {
    return (
      <div className="w-full aspect-[2/1] min-h-[300px] flex items-center justify-center bg-zinc-900/50 rounded-lg border border-white/5">
        <p className="text-sm text-zinc-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-[2/1] min-h-[300px] relative">
      <svg
        viewBox="0 0 900 500"
        className="w-full h-full rounded-lg"
        style={{ background: '#18181b' }}
      >
        <g>
          {countries.map((country) => {
            const id = country.id || '';
            const region = getRegionForNumericISO(id);
            const data = regionData.get(region) || null;
            const fillColor = data ? getFlowColor(data.netFlowTonnes) : '#374151';
            const isPriority = ['China', 'India', 'Russia'].includes(region);
            const path = pathGenerator(country.geometry);

            if (!path) return null;

            return (
              <path
                key={id}
                d={path}
                fill={fillColor}
                stroke={isPriority ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={isPriority ? 1 : 0.5}
                className="cursor-pointer transition-opacity duration-150 hover:opacity-80"
                onMouseMove={(e) => handleMouseMove(e, country, region, data)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </g>
      </svg>

      {tooltip.visible && (
        <div
          className="fixed z-50 pointer-events-none bg-zinc-900/95 border border-white/10 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          <div className="text-xs font-medium text-zinc-200 mb-1">
            {tooltip.countryName}
          </div>
          <div className="text-[10px] text-zinc-400 mb-1">
            Region: {tooltip.region}
          </div>
          <div className="space-y-0.5 text-[10px]">
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Holdings:</span>
              <span className="text-zinc-300">
                {tooltip.holdings !== null
                  ? `${tooltip.holdings.toFixed(2)} t`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Net Flow:</span>
              <span
                className={
                  tooltip.netFlow !== null && tooltip.netFlow > 0
                    ? 'text-emerald-400'
                    : tooltip.netFlow !== null && tooltip.netFlow < 0
                    ? 'text-rose-400'
                    : 'text-zinc-400'
                }
              >
                {tooltip.netFlow !== null
                  ? `${tooltip.netFlow > 0 ? '+' : ''}${tooltip.netFlow.toFixed(2)} t`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
