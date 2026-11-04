import { Script } from 'scripting'
import { upcoming, upcomingTerms, dayNumber, todayInfo, elapsedPeriods } from './model'
import calendar from './calendar'

function assert(ok: boolean, label: string) {
  if (!ok) throw new Error(label)
}
try {
  const terms = upcomingTerms(new Date(2026, 10, 3))
  assert(terms.map(item => item.name).join(',') === '立冬,小雪,大雪,冬至', '最近四个节气顺序')
  assert(terms.map(item => item.days).join(',') === '4,19,34,49', '节气倒数日')
  assert(upcomingTerms(new Date(2026, 10, 7))[0].days === 0, '节气当天保留')
  assert(upcomingTerms(new Date(2026, 10, 8))[0].name === '小雪', '节气次日切换')
  const nextYearTerms = upcomingTerms(new Date(2026, 11, 31))
  assert(nextYearTerms.length === 4 && nextYearTerms[0].name === '小寒' && nextYearTerms[0].date.startsWith('2027-'), '节气跨年补齐')
  console.log('PASS：节气顺序、倒数日、当天切换及跨年。')
  const close = (actual: number, expected: number, label: string) => assert(Math.abs(actual - expected) < 1e-12, label)
  close(elapsedPeriods(new Date(2026, 10, 2))[0].progress, 0, '周一重置')
  close(elapsedPeriods(new Date(2027, 0, 1))[2].progress, 0, '元旦重置年进度')
  close(elapsedPeriods(new Date(2028, 2, 1))[1].progress, 0, '闰月结束重置')
  // 以下固定分数适用于无夏令时的设备时区。
  if (new Date(2028, 0, 1).getTimezoneOffset() === -480) {
    close(elapsedPeriods(new Date(2026, 10, 1))[0].progress, 6 / 7, '周日仍属本周')
    close(elapsedPeriods(new Date(2026, 10, 2, 12))[0].progress, 1 / 14, '保留日内精度')
    close(elapsedPeriods(new Date(2028, 1, 29))[1].progress, 28 / 29, '闰年二月长度')
    close(elapsedPeriods(new Date(2028, 6, 1))[2].progress, 182 / 366, '闰年全年长度')
  }
  console.log('PASS：周月年进度及周期重置。')
  const current = upcoming(new Date(2026, 9, 31, 23, 59))
  assert(current[0].name === '元旦' && current[0].days === 62, '当前倒数日')
  assert(upcoming(new Date(2027, 0, 1))[0].days === 0, '节日当天')
  assert(upcoming(new Date(2027, 0, 2))[0].name === '春节', '节日次日切换')
  assert(upcoming(new Date(2029, 11, 31))[0].date === '2030-01-01', '跨年自动计算')
  assert(dayNumber('2028-03-01') - dayNumber('2028-02-28') === 2, '闰年')
  assert(dayNumber('2026-03-09') - dayNumber('2026-03-08') === 1, '夏令时日期差')
  assert(todayInfo(new Date(2027, 1, 6)).lunar === '正月初一', '春节农历')
  for (let y = 2026; y <= 2032; y++) {
    const list = upcoming(new Date(y, 0, 1)).filter(item => item.date.startsWith(String(y)))
    assert(list.length === 8, `${y}年节日数量：${list.length}`)
    assert(new Set(list.map(item => item.name)).size === 8, `${y}年节日重复`)
  }
  const lunarDates: Record<string, [number, number]> = { '春节': [1, 1], '元宵': [1, 15], '端午': [5, 5], '中秋': [8, 15] }
  const calculated = upcoming(new Date(2026, 0, 1))
  // 固定日期仅作为测试预期，不参与运行时节日生成。
  for (const [name, date] of [['春节', '2027-02-06'], ['端午', '2027-06-09'], ['中秋', '2028-10-03'], ['清明', '2028-04-04']]) {
    assert(calculated.some(item => item.name === name && item.date === date), `${name} ${date} 计算回归`)
  }
  for (const { name, date: key } of calculated) {
    const [y, m, d] = key.split('-').map(Number)
    if (lunarDates[name]) {
      const lunar = calendar.solar2lunar(y, m, d)
      const [lm, ld] = lunarDates[name]
      assert(lunar !== -1 && lunar.lMonth === lm && lunar.lDay === ld && !lunar.isLeap, `${name} ${key} 日期核验`)
    }
  }
  console.log('PASS：倒数日、当天切换、跨年、闰年、夏令时日期差、农历及2026—2032年节日去重。')
} finally {
  Script.exit()
}
