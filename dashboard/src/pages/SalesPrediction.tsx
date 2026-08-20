import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { api, type SalesMetricsResponse, type ThresholdUpdate } from '../lib/api'
import { Card, CardTitle } from '../components/ui/Card'
import { StatCard, LoadingState, Button } from '../components/ui'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Badge'
import { fmtPct } from '../lib/utils'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, BarChart, Bar, Cell
} from 'recharts'

const CHART_COLORS = ['#10B981','#8B5CF6','#F59E0B','#EF4444','#06B6D4','#EC4899']

const thresholdFields = [
  { key: 'near_expiry_days', label: 'Near Expiry (days)', min: 3, max: 30, suffix: 'd' },
  { key: 'low_stock_days',   label: 'Low Stock (days left)', min: 1, max: 14, suffix: 'd' },
  { key: 'trend_up_pct',     label: 'Trending Up (%)', min: 5, max: 100, suffix: '%' },
]

export default function SalesPrediction() {
  const [data, setData] = useState<SalesMetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [thresholds, setThresholds] = useState<ThresholdUpdate>({
    near_expiry_days: 14, low_stock_days: 5, trend_up_pct: 25
  })

  const load = () => {
    setLoading(true)
    api.getSalesMetrics()
      .then(d => { setData(d); setThresholds(d.thresholds) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function saveThresholds() {
    setSaving(true)
    try {
      await api.updateThresholds(thresholds)
      setMsg('Thresholds saved successfully.')
      load()
    } catch { setMsg('Save failed. Please try again.') }
    finally { setSaving(false); setTimeout(() => setMsg(null), 3000) }
  }

  if (loading) return <LoadingState message="Loading sales data..." />

  const products = data ? Object.keys(data.history) : []
  const chartData = data ? Array.from({ length: 30 }, (_, i) => {
    const pt: Record<string, unknown> = { day: `D${i + 1}` }
    products.slice(0, 6).forEach(p => { pt[p] = data.history[p]?.[i] ?? 0 })
    return pt
  }) : []

  const trendData = data ? Object.entries(data.metrics)
    .map(([name, m]) => ({ name, trend: m.trend_pct, avg: m.avg_daily_sales_7d }))
    .sort((a, b) => Math.abs(b.trend) - Math.abs(a.trend))
    .slice(0, 10) : []

  const chartTooltipStyle = {
    background: '#0F1420',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    fontSize: 11,
    color: '#E2E8F0',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-[24px] tracking-tight" style={{ color: '#F1F5F9' }}>
            📈 Sales Prediction
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#475569' }}>
            30-day simulated sales velocity, trend analysis, and days-of-stock-left forecasting.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={load}>
          Refresh
        </Button>
      </div>

      {msg && (
        <Alert variant={msg.includes('failed') ? 'error' : 'success'}>
          {msg}
        </Alert>
      )}

      {/* Threshold controls */}
      <Card hover>
        <CardTitle icon={<span>⚙️</span>}>Rule Engine Thresholds</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { key: 'near_expiry_days', label: 'Near Expiry (days)', min: 3, max: 30, suffix: 'd' },
            { key: 'low_stock_days',   label: 'Low Stock (days left)', min: 1, max: 14, suffix: 'd' },
            { key: 'trend_up_pct',     label: 'Trending Up (%)', min: 5, max: 100, suffix: '%' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>{f.label}</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={f.min} max={f.max}
                  value={thresholds[f.key as keyof ThresholdUpdate] ?? f.min}
                  onChange={e => setThresholds(t => ({ ...t, [f.key]: +e.target.value }))}
                  className="flex-1"
                />
                <span className="font-mono-custom text-sm font-bold w-12 text-right" style={{ color: '#10B981' }}>
                  {thresholds[f.key as keyof ThresholdUpdate]}{f.suffix}
                </span>
              </div>
            </div>
          ))}
        </div>
        <Button variant="primary" size="sm" className="mt-5" loading={saving} onClick={saveThresholds}>
          Apply Thresholds
        </Button>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp size={16} />} label="Products Tracked" value={data ? Object.keys(data.metrics).length : '—'} color="green" />
        <StatCard icon={<TrendingDown size={16} />} label="Discount Candidates" value={data?.discount_triggers.length ?? '—'} color="orange" />
        <StatCard icon={<RefreshCw size={16} />} label="Restock Candidates" value={data?.restock_triggers.length ?? '—'} color="red" />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Avg Days of Stock"
          value={data ? (Object.values(data.metrics).reduce((s, m) => s + (m.days_of_stock_left === 999 ? 30 : m.days_of_stock_left), 0) / Object.keys(data.metrics).length).toFixed(1) : '—'}
          color="cyan"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card hover>
          <CardTitle icon={<span>📉</span>}>30-Day Sales Trend</CardTitle>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748B' }} />
              {products.slice(0, 6).map((p, i) => (
                <Line
                  key={p} type="monotone" dataKey={p}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={1.5} dot={false} name={p}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card hover>
          <CardTitle icon={<span>⚡</span>}>Sales Trend % (Top 10 SKUs)</CardTitle>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6B7280' }} width={80} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: unknown) => fmtPct(v as number)} contentStyle={chartTooltipStyle} />
              <Bar dataKey="trend" name="Trend %" radius={[0, 4, 4, 0]}
                label={{ position: 'right', fontSize: 10, fill: '#475569', formatter: (v: unknown) => fmtPct(v as number) }}
              >
                {trendData.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={entry.trend >= 0 ? '#6366F1' : '#EF4444'}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Threshold controls */}
      <Card>
        <CardTitle icon={<RefreshCw size={14} />} subtitle="Adjust the rules engine thresholds that trigger discount and restock recommendations.">
          Rule Engine Thresholds
        </CardTitle>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {thresholdFields.map(f => (
            <div key={f.key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  {f.label}
                </label>
                <span className="font-mono-custom text-[12px] font-bold text-indigo-600">
                  {thresholds[f.key as keyof ThresholdUpdate]}{f.suffix}
                </span>
              </div>
              <input
                type="range" min={f.min} max={f.max}
                value={thresholds[f.key as keyof ThresholdUpdate] ?? f.min}
                onChange={e => setThresholds(t => ({ ...t, [f.key]: +e.target.value }))}
                className="w-full"
              />
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
                <span>{f.min}{f.suffix}</span>
                <span>{f.max}{f.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
          <Button variant="primary" size="sm" loading={saving} onClick={saveThresholds}>
            Apply Thresholds
          </Button>
          <span className="text-[12px] text-gray-400">Changes will recalculate triggers on all products</span>
        </div>
      </Card>

      {/* Full metrics table */}
      <Card noPad>
        <div className="px-5 pt-5 pb-3">
          <CardTitle icon={<span>📋</span>}>Product Metrics Table</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Product','Stock','7-Day Avg','Trend','Days Left','Expiry','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px]" style={{ color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data && Object.entries(data.metrics).map(([name, m]) => {
                const trigger = data.triggers.find(t => t.product === name)
                return (
                  <tr key={name} className="table-row-hover transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3 font-semibold capitalize" style={{ color: '#E2E8F0' }}>{name}</td>
                    <td className="px-4 py-3 font-mono-custom font-semibold" style={{ color: '#F1F5F9' }}>{m.current_stock}</td>
                    <td className="px-4 py-3 font-mono-custom" style={{ color: '#94A3B8' }}>{m.avg_daily_sales_7d}</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.trend_pct >= 0 ? 'green' : 'red'}>{fmtPct(m.trend_pct)}</Badge>
                    </td>
                    <td
                      className="px-4 py-3 font-mono-custom font-semibold"
                      style={{ color: m.days_of_stock_left < 5 ? '#F87171' : m.days_of_stock_left < 10 ? '#FCD34D' : '#94A3B8' }}
                    >
                      {m.days_of_stock_left === 999 ? '∞' : m.days_of_stock_left}d
                    </td>
                    <td className="px-4 py-3 font-mono-custom text-[11px]" style={{ color: m.days_until_expiry < 14 ? '#F87171' : '#475569' }}>
                      {m.expiry_date}
                    </td>
                    <td className="px-6 py-3">
                      {trigger
                        ? <Badge variant={trigger.action === 'discount' ? 'orange' : 'violet'}>{trigger.action}</Badge>
                        : <Badge variant="green">OK</Badge>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
