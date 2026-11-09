import React, { useState, useRef } from 'react';
import { Download } from 'lucide-react';
import { VizType, GlobalSortOption } from '../types';
import { COLOR_PALETTES } from '../utils/dataEngine';
import { sortChartData } from '../utils/filterAndSort';

interface ChartDataItem {
  label: string;
  value: number;
  secondaryValue?: number;
  extra?: string;
}

interface DynamicChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataItem[];
  valuePrefix?: string;
  valueSuffix?: string;
  defaultVizType?: VizType;
  showControls?: boolean;
  height?: number;
  sortOption?: GlobalSortOption;
}

export const DynamicChart: React.FC<DynamicChartProps> = ({
  title,
  subtitle,
  data,
  valuePrefix = '',
  valueSuffix = '',
  defaultVizType = 'Bar',
  showControls = true,
  height = 260,
  sortOption = 'default'
}) => {
  const [vizType, setVizType] = useState<VizType>(defaultVizType);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Modern Sage Palette by default
  const colors = COLOR_PALETTES['Modern Sage'];

  // Apply sorting if requested
  const processedData = sortOption !== 'default' ? sortChartData(data, sortOption) : data;

  const maxValue = Math.max(...processedData.map(d => Math.max(d.value, d.secondaryValue || 0)), 1);
  const totalValue = processedData.reduce((sum, d) => sum + Math.max(0, d.value), 0);

  // Pie chart arc paths calculation
  const getPieSlices = () => {
    if (totalValue === 0) return [];
    let cumulativeAngle = -Math.PI / 2; // start at top

    return processedData.map((item, index) => {
      const slicePct = Math.max(0, item.value) / totalValue;
      const sliceAngle = slicePct * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle = endAngle;

      // Arc coordinates
      const cx = 95;
      const cy = 95;
      const r = 78;
      const innerR = 40; // Donut style

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle - 0.0001);
      const y2 = cy + r * Math.sin(endAngle - 0.0001);

      const ix1 = cx + innerR * Math.cos(endAngle - 0.0001);
      const iy1 = cy + innerR * Math.sin(endAngle - 0.0001);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const pathD = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

      return {
        item,
        index,
        pathD,
        pct: Math.round(slicePct * 100),
        color: colors[index % colors.length]
      };
    });
  };

  const pieSlices = vizType === 'Pie' ? getPieSlices() : [];
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExportPng = () => {
    if (!chartRef.current) return;
    const width = chartRef.current.offsetWidth || 560;
    const heightVal = chartRef.current.offsetHeight || 320;
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = heightVal * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, heightVal);

    ctx.fillStyle = '#33443c';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(title, 16, 26);
    if (subtitle) {
      ctx.fillStyle = '#5e8673';
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(subtitle, 16, 42);
    }

    const svgEl = chartRef.current.querySelector('svg');
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const DOMURL = window.URL || window.webkitURL || window;
      const url = DOMURL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 16, 50, width - 32, heightVal - 70);
        DOMURL.revokeObjectURL(url);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_chart.png`;
        a.href = pngUrl;
        a.click();
      };
      img.src = url;
    } else {
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_chart.png`;
      a.href = pngUrl;
      a.click();
    }
  };

  return (
    <div ref={chartRef} className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-[#94b4a5]/30">
        <div>
          <h4 className="text-sm font-bold text-[#33443c] flex items-center gap-1.5">
            {title}
          </h4>
          {subtitle && <p className="text-xs text-[#5e8673] font-medium mt-0.5">{subtitle}</p>}
        </div>

        {showControls && (
          <div className="flex items-center gap-2">
            {/* Viz Type selector: includes Bar, Line, Pie, Funnel, Scatter */}
            <div className="flex items-center bg-[#f4f7f5] border border-[#94b4a5]/50 rounded-lg p-0.5 text-xs">
              <span className="text-[10px] text-[#5e8673] px-1.5 font-semibold">Type:</span>
              <select
                value={vizType}
                onChange={(e) => setVizType(e.target.value as VizType)}
                className="bg-transparent text-[#33443c] text-xs font-semibold focus:outline-none pr-1 py-0.5 cursor-pointer"
              >
                <option value="Bar" className="bg-white text-[#33443c]">Bar</option>
                <option value="Line" className="bg-white text-[#33443c]">Line</option>
                <option value="Pie" className="bg-white text-[#33443c]">Pie</option>
                <option value="Funnel" className="bg-white text-[#33443c]">Funnel</option>
                <option value="Scatter" className="bg-white text-[#33443c]">Scatter</option>
              </select>
            </div>

            {/* Chart Export (.png) Button */}
            <button
              onClick={handleExportPng}
              className="flex items-center gap-1 bg-[#f4f7f5] hover:bg-[#94b4a5]/20 text-[#33443c] border border-[#94b4a5]/50 px-2 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              title="Export this chart as PNG image"
            >
              <Download className="w-3 h-3 text-[#5e8673]" />
              <span className="text-[11px] font-semibold">PNG</span>
            </button>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="relative w-full overflow-hidden flex items-end justify-center" style={{ height: `${height}px` }}>
        {processedData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-[#5e8673] font-medium">
            No data available to display. Upload CSV datasets to populate charts.
          </div>
        ) : vizType === 'Bar' ? (
          /* BAR CHART */
          <div className="w-full h-full flex items-end justify-between gap-2 px-2 pt-6 pb-6">
            {processedData.map((item, index) => {
              const primaryHeight = (item.value / maxValue) * 100;
              const hasSecondary = item.secondaryValue !== undefined;
              const secondaryHeight = hasSecondary ? ((item.secondaryValue || 0) / maxValue) * 100 : 0;
              const color = colors[index % colors.length];
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={index}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-10 z-20 bg-[#33443c] text-white text-xs px-2.5 py-1 rounded-md shadow-xl border border-[#5e8673]/40 whitespace-nowrap pointer-events-none">
                      <span className="font-semibold text-[#94b4a5]">{item.label}</span>: {valuePrefix}{item.value.toLocaleString()}{valueSuffix}
                      {hasSecondary && (
                        <div className="text-[10px] text-slate-300">
                          Capacity: {valuePrefix}{item.secondaryValue?.toLocaleString()}{valueSuffix}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bars container */}
                  <div className="w-full flex items-end justify-center gap-1 h-[82%]">
                    <div
                      className="w-full max-w-[28px] rounded-t-md transition-all duration-300 relative"
                      style={{
                        height: `${Math.max(primaryHeight, 4)}%`,
                        backgroundColor: color,
                        opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                        boxShadow: isHovered ? `0 0 12px ${color}66` : 'none'
                      }}
                    >
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-[#33443c] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.value}
                      </div>
                    </div>

                    {hasSecondary && (
                      <div
                        className="w-full max-w-[28px] rounded-t-md transition-all duration-300 bg-[#94b4a5]/40 border border-[#94b4a5]/60"
                        style={{
                          height: `${Math.max(secondaryHeight, 4)}%`,
                          opacity: hoveredIndex !== null && !isHovered ? 0.35 : 0.85
                        }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <span className="text-[11px] text-[#5e8673] truncate w-full text-center mt-2 group-hover:text-[#33443c] font-semibold transition-colors">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : vizType === 'Pie' ? (
          /* PIE / DONUT CHART */
          <div className="w-full h-full flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
            {/* SVG Pie container */}
            <div className="relative flex items-center justify-center w-48 h-48 shrink-0">
              <svg viewBox="0 0 190 190" className="w-full h-full overflow-visible">
                {pieSlices.map((slice) => {
                  const isHovered = hoveredIndex === slice.index;
                  return (
                    <path
                      key={slice.index}
                      d={slice.pathD}
                      fill={slice.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-200 hover:opacity-90"
                      style={{
                        filter: isHovered ? 'brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.2))' : 'none',
                        transformOrigin: '95px 95px',
                        transform: isHovered ? 'scale(1.04)' : 'scale(1)'
                      }}
                      onMouseEnter={() => setHoveredIndex(slice.index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
                {/* Center hole text */}
                <circle cx="95" cy="95" r="38" fill="#ffffff" />
                <text
                  x="95"
                  y="91"
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-[#5e8673]"
                >
                  {hoveredIndex !== null && processedData[hoveredIndex]
                    ? `${pieSlices[hoveredIndex]?.pct || 0}%`
                    : 'TOTAL'}
                </text>
                <text
                  x="95"
                  y="105"
                  textAnchor="middle"
                  className="text-[11px] font-extrabold font-mono fill-[#33443c]"
                >
                  {hoveredIndex !== null && processedData[hoveredIndex]
                    ? `${valuePrefix}${processedData[hoveredIndex].value.toLocaleString()}`
                    : `${valuePrefix}${totalValue.toLocaleString()}`}
                </text>
              </svg>
            </div>

            {/* Pie Legend & Percentages */}
            <div className="flex-1 w-full overflow-y-auto max-h-[220px] pr-2 space-y-1.5 scrollbar-thin">
              {pieSlices.map((slice) => {
                const isHovered = hoveredIndex === slice.index;
                return (
                  <div
                    key={slice.index}
                    onMouseEnter={() => setHoveredIndex(slice.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      isHovered ? 'bg-[#f4f7f5] text-[#33443c] font-bold' : 'hover:bg-[#f4f7f5]/60 text-[#33443c]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-3 h-3 rounded-md shrink-0 shadow-2xs"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="truncate">{slice.item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono shrink-0 text-right">
                      <span className="text-[#5e8673] font-semibold text-[11px]">
                        {valuePrefix}{slice.item.value.toLocaleString()}{valueSuffix}
                      </span>
                      <span className="text-[10px] bg-[#94b4a5]/30 text-[#33443c] px-1.5 py-0.5 rounded font-bold">
                        {slice.pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : vizType === 'Line' ? (
          /* LINE CHART (SVG) */
          <div className="w-full h-full p-2 relative flex flex-col justify-end">
            <svg className="w-full h-[85%] overflow-visible" viewBox={`0 0 ${Math.max(100, processedData.length * 50)} 100`} preserveAspectRatio="none">
              <defs>
                <linearGradient id={`grad-${title.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={colors[0]} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={colors[0]} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="0" y1="20" x2={processedData.length * 50} y2="20" stroke="#d6e4dc" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="0" y1="50" x2={processedData.length * 50} y2="50" stroke="#d6e4dc" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="0" y1="80" x2={processedData.length * 50} y2="80" stroke="#d6e4dc" strokeDasharray="3 3" strokeWidth="0.8" />

              {/* Area path */}
              <path
                d={
                  processedData.map((d, i) => {
                    const x = i * 50 + 25;
                    const y = 95 - (d.value / maxValue) * 80;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ') + ` L ${(processedData.length - 1) * 50 + 25} 95 L 25 95 Z`
                }
                fill={`url(#grad-${title.replace(/[^a-zA-Z0-9]/g, '')})`}
              />

              {/* Line path */}
              <path
                d={processedData.map((d, i) => {
                  const x = i * 50 + 25;
                  const y = 95 - (d.value / maxValue) * 80;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke={colors[0]}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points */}
              {processedData.map((d, i) => {
                const x = i * 50 + 25;
                const y = 95 - (d.value / maxValue) * 80;
                const isHovered = hoveredIndex === i;
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5.5 : 3.5}
                      fill={colors[i % colors.length]}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Labels under line points */}
            <div className="w-full flex justify-between px-1 text-[11px] text-[#5e8673] pt-1">
              {processedData.map((item, i) => (
                <div
                  key={i}
                  className="flex-1 text-center truncate cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span className={hoveredIndex === i ? 'text-[#33443c] font-bold' : 'font-medium'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Tooltip for Line */}
            {hoveredIndex !== null && processedData[hoveredIndex] && (
              <div className="absolute top-2 right-3 bg-[#33443c] border border-[#5e8673]/40 px-2.5 py-1 rounded text-xs text-white shadow-xl">
                <span className="font-semibold text-[#94b4a5]">{processedData[hoveredIndex].label}</span>: {valuePrefix}{processedData[hoveredIndex].value.toLocaleString()}{valueSuffix}
              </div>
            )}
          </div>
        ) : vizType === 'Funnel' ? (
          /* FUNNEL CHART */
          <div className="w-full h-full flex flex-col justify-center gap-1.5 py-2 px-4">
            {processedData.map((item, index) => {
              const widthPct = Math.max(25, (item.value / maxValue) * 100);
              const color = colors[index % colors.length];
              const isHovered = hoveredIndex === index;
              return (
                <div
                  key={index}
                  className="w-full flex items-center justify-between text-xs group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span className="w-28 truncate text-[#33443c] font-semibold text-left">
                    {item.label}
                  </span>

                  <div className="flex-1 flex justify-center px-2">
                    <div
                      className="h-6 rounded-md flex items-center justify-end px-2.5 transition-all duration-300 shadow-xs"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: color,
                        opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1,
                        boxShadow: isHovered ? `0 0 10px ${color}88` : 'none'
                      }}
                    >
                      <span className="text-[10px] font-bold text-white font-mono">
                        {valuePrefix}{item.value.toLocaleString()}{valueSuffix}
                      </span>
                    </div>
                  </div>

                  <span className="w-12 text-right text-[#5e8673] font-mono text-[11px] font-semibold">
                    {Math.round((item.value / maxValue) * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* SCATTER PLOT */
          <div className="w-full h-full relative p-3 flex flex-col justify-between">
            <svg className="w-full h-[85%] overflow-visible">
              {/* Axes lines */}
              <line x1="20" y1="10" x2="20" y2="180" stroke="#d6e4dc" strokeWidth="1.5" />
              <line x1="20" y1="180" x2="98%" y2="180" stroke="#d6e4dc" strokeWidth="1.5" />

              {processedData.map((d, i) => {
                const total = processedData.length;
                const xPct = 10 + (i / Math.max(1, total - 1)) * 80;
                const yPct = 10 + (1 - d.value / maxValue) * 75;
                const color = colors[i % colors.length];
                const isHovered = hoveredIndex === i;

                return (
                  <g key={i}>
                    <circle
                      cx={`${xPct}%`}
                      cy={`${yPct}%`}
                      r={isHovered ? 9 : 6}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                    <text
                      x={`${xPct}%`}
                      y={`${yPct - 10}%`}
                      textAnchor="middle"
                      fill="#33443c"
                      fontSize="9"
                      fontWeight="bold"
                      className="pointer-events-none font-mono"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {hoveredIndex !== null && processedData[hoveredIndex] && (
              <div className="absolute top-2 right-4 bg-[#33443c] border border-[#5e8673]/40 px-2.5 py-1 rounded text-xs text-white shadow-xl">
                <span className="font-semibold text-[#94b4a5]">{processedData[hoveredIndex].label}</span>: {valuePrefix}{processedData[hoveredIndex].value.toLocaleString()}{valueSuffix}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
