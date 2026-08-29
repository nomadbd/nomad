import React, { useState } from 'react';
import { ChartPoint, MetricType, GranularityType } from './adminOverview.types';
import { formatNumber, getSmoothPath } from './adminOverview.utils';

interface OverviewChartProps {
  chartData: ChartPoint[];
  selectedMetric: MetricType;
  granularity: GranularityType;
  setSelectedMetric: (metric: MetricType) => void;
}

export const OverviewChart: React.FC<OverviewChartProps> = ({
  chartData,
  selectedMetric,
  granularity,
  setSelectedMetric,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const renderSVGChart = () => {
    if (chartData.length === 0) {
      return (
        <div style={{ padding: '35px 0', textAlign: 'center', color: '#666', fontSize: '11px', letterSpacing: '1px' }}>
          NO TRANSACTION DATA AVAILABLE FOR SELECTED PERIOD
        </div>
      );
    }

    const svgWidth = 650;
    const svgHeight = 240;
    const paddingTop = 35;
    const paddingBottom = 45;
    const paddingLeft = 60;
    const paddingRight = 20;

    const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
    const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

    const getValue = (pt: ChartPoint) => {
      if (selectedMetric === 'REVENUE') return pt.revenue;
      if (selectedMetric === 'ORDERS') return pt.orders;
      return pt.aov;
    };

    const displayValues = chartData.map(getValue);
    const rawMax = Math.max(...displayValues, 0);

    const maxValue = selectedMetric === 'ORDERS' 
      ? Math.max(rawMax * 1.3, 4) 
      : Math.max(rawMax * 1.25, 100);

    const points = chartData.map((pt, index) => {
      const val = getValue(pt);
      const x =
        chartData.length === 1
          ? paddingLeft + chartInnerWidth / 2
          : paddingLeft + (index / (chartData.length - 1)) * chartInnerWidth;
      const y = svgHeight - paddingBottom - (val / maxValue) * chartInnerHeight;
      return { x, y, pt, val };
    });

    const smoothPathD = getSmoothPath(points);

    const areaD =
      points.length > 0
        ? `${smoothPathD} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
        : '';

    const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;
    const showBelow = activePoint ? activePoint.y < 110 : false;

    const step = points.length > 30 ? 4 : points.length > 15 ? 2 : 1;

    const getXAxisTickLabel = (pt: ChartPoint) => {
      if (granularity === 'DAILY') {
        const parts = pt.dateKey.split('-');
        if (parts.length === 3) return parts[2];
      }
      return pt.label;
    };

    const yCenter = paddingTop + chartInnerHeight / 2;

    return (
      <div style={{ position: 'relative', width: '100%', padding: '8px 0', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <text
            x={12}
            y={yCenter}
            fill="#718096"
            fontSize="9"
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
            transform={`rotate(90, 12, ${yCenter})`}
          >
            {selectedMetric} ({selectedMetric === 'ORDERS' ? 'COUNT' : 'AMOUNT ৳'})
          </text>

          {[0, 0.5, 1].map((ratio, idx) => {
            const yPos = svgHeight - paddingBottom - ratio * chartInnerHeight;
            const gridVal = Math.round(ratio * maxValue);
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={yPos} x2={svgWidth - paddingRight} y2={yPos} stroke="#1b1b1b" strokeDasharray="3 3" />
                <text x={paddingLeft - 8} y={yPos + 3} fill="#555" fontSize="9" textAnchor="end" fontFamily="monospace">
                  {selectedMetric === 'ORDERS' ? formatNumber(gridVal) : `৳${formatNumber(gridVal)}`}
                </text>
              </g>
            );
          })}

          {areaD && <path d={areaD} fill="url(#chartGradient)" style={{ transition: 'd 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }} />}
          {smoothPathD && (
            <path d={smoothPathD} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'd 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }} />
          )}

          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            const showLabel = points.length < 4 ? true : i % step === 0;

            return (
              <g key={i}>
                <circle
                  cx={p.x} cy={p.y} r={isHovered ? '5' : p.val > 0 ? '2.5' : '1.5'}
                  fill={isHovered ? '#22d3ee' : p.val > 0 ? '#22d3ee' : '#111'}
                  stroke="#22d3ee" strokeWidth={isHovered ? '2.5' : '1'}
                  style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />

                <rect
                  x={p.x - Math.max(chartInnerWidth / points.length / 2, 6)} y={paddingTop}
                  width={Math.max(chartInnerWidth / points.length, 12)} height={chartInnerHeight}
                  fill="transparent" style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredIndex(i)}
                  onTouchStart={() => setHoveredIndex(i)}
                />

                {showLabel && (
                  <text x={p.x} y={svgHeight - 24} fill="#718096" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    {getXAxisTickLabel(p.pt)}
                  </text>
                )}
              </g>
            );
          })}

          <text x={paddingLeft + chartInnerWidth / 2} y={svgHeight - 4} fill="#718096" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
            Date
          </text>

          {activePoint && (
            <line x1={activePoint.x} y1={paddingTop} x2={activePoint.x} y2={svgHeight - paddingBottom} stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 2" />
          )}
        </svg>

        {activePoint && (
          <div
            style={{
              position: 'absolute',
              top: `${(activePoint.y / svgHeight) * 100}%`,
              left: `${Math.min(Math.max((activePoint.x / svgWidth) * 100, 22), 78)}%`,
              transform: showBelow ? 'translate(-50%, 12px)' : 'translate(-50%, calc(-100% - 12px))',
              backgroundColor: '#0c0c0c', 
              border: '1px solid #22d3ee', 
              padding: '8px 12px',
              borderRadius: '4px', 
              boxShadow: '0 8px 24px rgba(0,0,0,0.95)', 
              pointerEvents: 'none',
              zIndex: 30, 
              minWidth: '140px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ fontSize: '10px', color: '#888', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.5px' }}>
              {activePoint.pt.label}
            </div>
            <div style={{ fontSize: '12px', color: '#22d3ee', fontWeight: 'bold', marginBottom: '2px' }}>
              REV: ৳{formatNumber(activePoint.pt.revenue)}
            </div>
            <div style={{ fontSize: '10px', color: '#A0AEC0', marginBottom: '1px' }}>
              ORDERS: {activePoint.pt.orders}
            </div>
            <div style={{ fontSize: '10px', color: '#A0AEC0' }}>
              AOV: ৳{formatNumber(activePoint.pt.aov)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="animate-card"
      style={{
        backgroundColor: '#080808',
        border: '1px solid #222',
        padding: '18px 16px',
        borderRadius: '2px',
        marginTop: '10px',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', color: '#CBD5E0', fontWeight: 'bold', letterSpacing: '1px' }}>
          ANALYTICS TREND
        </span>

        <div style={{ display: 'flex', gap: '4px' }}>
          {(['REVENUE', 'ORDERS', 'AOV'] as MetricType[]).map((m) => (
            <button
              key={m}
              className={`filter-toggle-btn ${selectedMetric === m ? 'active' : ''}`}
              onClick={() => setSelectedMetric(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {renderSVGChart()}
    </div>
  );
};
