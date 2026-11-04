import calendar from './calendar'

export interface Festival { name: string; date: string; days: number }
const DAY = 86400000
const pad = (n: number) => String(n).padStart(2, '0')
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
// 用本地日历日期构造 UTC 序数，避免夏令时导致相差一天。
export function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY
}
export function upcoming(now = new Date()): Festival[] {
  const year = now.getFullYear()
  const today = dayNumber(dateKey(now))
  const entries = new Map<string, [string, string]>()
  const add = (name: string, key: string) => {
    entries.set(`${key}/${name}`, [name, key])
  }
  for (let y = year; y <= year + 2; y++) {
    add('元旦', `${y}-01-01`)
    add('劳动', `${y}-05-01`)
    add('国庆', `${y}-10-01`)
    if (y >= 1901 && y <= 2099) {
      const qingming = calendar.getTerm(y, 7)
      add('清明', `${y}-04-${pad(qingming)}`)
      for (const [name, month, day] of [['春节', 1, 1], ['元宵', 1, 15], ['端午', 5, 5], ['中秋', 8, 15]] as const) {
        const lunar = calendar.lunar2solar(y, month, day, false)
        if (lunar !== -1) add(name, `${lunar.cYear}-${pad(lunar.cMonth)}-${pad(lunar.cDay)}`)
      }
    }
  }
  return [...entries.values()]
    .map(([name, date]) => ({ name, date, days: dayNumber(date) - today }))
    .filter(item => item.days >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}
export function upcomingTerms(now = new Date()): Festival[] {
  const year = now.getFullYear()
  const today = dayNumber(dateKey(now))
  const items: Festival[] = []
  for (let y = year; y <= year + 1; y++) {
    if (y < 1901 || y > 2099) continue
    for (let n = 1; n <= 24; n++) {
      const date = `${y}-${pad(Math.ceil(n / 2))}-${pad(calendar.getTerm(y, n))}`
      const days = dayNumber(date) - today
      if (days >= 0) items.push({ name: calendar.solarTerm[n - 1], date, days })
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)
}

export function todayInfo(now = new Date()) {
  const y = now.getFullYear()
  const lunar = y >= 1901 && y <= 2099 ? calendar.solar2lunar(y, now.getMonth() + 1, now.getDate()) : -1
  return {
    date: `${now.getMonth() + 1}月${now.getDate()}日`,
    week: `周${'日一二三四五六'[now.getDay()]}`,
    lunar: lunar === -1 ? '' : `${lunar.IMonthCn}${lunar.IDayCn}`,
    year: lunar === -1 ? `${y}年` : `${lunar.gzYear} · ${lunar.Animal}年`,
    astro: lunar === -1 ? '' : lunar.astro,
    term: lunar === -1 ? '' : (lunar.Term || ''),
  }
}
// 按本地日历边界计算，兼容闰年、不同月长与夏令时。
export function elapsedPeriods(now = new Date()) {
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const monday = d - (now.getDay() + 6) % 7
  const periods = [
    { label: '本周', start: new Date(y, m, monday), end: new Date(y, m, monday + 7) },
    { label: '本月', start: new Date(y, m, 1), end: new Date(y, m + 1, 1) },
    { label: '本年', start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) },
  ]
  return periods.map(({ label, start, end }) => ({
    label,
    progress: Math.max(0, Math.min(1, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime()))),
  }))
}

export function nextMidnight(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1)
}
