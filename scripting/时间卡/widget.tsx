import { VStack, HStack, ZStack, Circle, Capsule, Text, Image, Spacer, Divider, Widget, Script } from 'scripting'
import { upcoming, upcomingTerms, todayInfo, elapsedPeriods, Festival } from './model'

const accent = { light: '#B85436', dark: '#FFAC8C' } as const
const todayAccent = { light: '#C52D27', dark: '#FF8078' } as const
const muted = { light: '#79756E', dark: '#AAA59E' } as const
const ink = { light: '#302E2A', dark: '#F3EEE7' } as const
const paper = { light: '#FAF7F1', dark: '#211F1D' } as const

function Countdown({ item, small = false, centered = false }: { item: Festival; small?: boolean; centered?: boolean }) {
  return <VStack alignment={centered ? 'center' : 'leading'} spacing={2} frame={{ maxWidth: Infinity, alignment: centered ? 'center' : 'leading' }}>
    <HStack spacing={5} foregroundStyle={item.days === 0 ? todayAccent : accent}>
      <Image systemName={item.days === 0 ? 'sparkles' : 'calendar'} font={12} />
      <Text font={13} fontWeight="semibold">{item.days === 0 ? `今日${item.name}` : `距${item.name}`}</Text>
    </HStack>
    <HStack alignment="firstTextBaseline" spacing={3}>
      <Text font={small ? 46 : centered ? 38 : 48} fontDesign="rounded" fontWeight="bold" monospacedDigit foregroundStyle={item.days === 0 ? todayAccent : accent} widgetAccentable lineLimit={1} minScaleFactor={0.6}>{item.days === 0 ? '今天' : String(item.days)}</Text>
      {item.days > 0 ? <Text font={11} foregroundStyle={muted}>天</Text> : null}
    </HStack>
    <Text font={10} monospacedDigit foregroundStyle={muted}>{item.date.replace(/-/g, '.')}</Text>
  </VStack>
}
function FestivalRow({ item, large = false }: { item: Festival; large?: boolean }) {
  return <HStack spacing={8} frame={{ maxWidth: Infinity }}>
    <Text font={large ? 14 : 12} fontWeight={item.days === 0 ? 'bold' : 'medium'} foregroundStyle={item.days === 0 ? todayAccent : ink}>{item.name}</Text>
    <Text font={10} monospacedDigit foregroundStyle={muted}>{item.date.slice(5).replace('-', '.')}</Text>
    <Spacer minLength={0} />
    <HStack alignment="firstTextBaseline" spacing={2}>
      <Text font={large ? 19 : 17} fontWeight={item.days === 0 ? 'bold' : 'semibold'} foregroundStyle={item.days === 0 ? todayAccent : ink} fontDesign="rounded" monospacedDigit>{item.days === 0 ? '今天' : String(item.days)}</Text>
      {item.days > 0 ? <Text font={9} foregroundStyle={muted}>天</Text> : null}
    </HStack>
  </HStack>
}
function FestivalTimeline({ items, solar = false }: { items: Festival[]; solar?: boolean }) {
  return <VStack alignment="leading" spacing={3} frame={{ maxWidth: Infinity }}>
    {items.map(item => <VStack alignment="leading" spacing={1} frame={{ maxWidth: Infinity, height: 26, alignment: 'leading' }}>
      <HStack spacing={5}>
        <Capsule fill={item.days === 0 ? todayAccent : solar ? { light: '#658570', dark: '#A2C5AC' } : accent} frame={{ width: 3, height: 12 }} />
        <Text font={11} fontWeight={item.days === 0 ? 'bold' : 'medium'} foregroundStyle={item.days === 0 ? todayAccent : ink} lineLimit={1}>{item.name}</Text>
      </HStack>
      <HStack alignment="firstTextBaseline" spacing={3}>
        <Text font={9} fontWeight={item.days === 0 ? 'semibold' : 'regular'} monospacedDigit foregroundStyle={item.days === 0 ? todayAccent : muted} lineLimit={1}
          frame={{ width: 28, alignment: 'leading' }}>{item.date.slice(5).replace('-', '/')}</Text>
        <Text font={item.days === 0 ? 10 : 9} fontWeight={item.days === 0 ? 'heavy' : 'regular'} monospacedDigit foregroundStyle={item.days === 0 ? todayAccent : muted} lineLimit={1} minScaleFactor={0.8}
          frame={{ width: 27, alignment: 'trailing' }}>{item.days === 0 ? '今天' : `${item.days}天`}</Text>
      </HStack>
    </VStack>)}
  </VStack>
}
function TimeProgress({ now }: { now: Date }) {
  const colors = [accent, { light: '#658570', dark: '#A2C5AC' }, { light: '#68849B', dark: '#A1BED5' }] as const
  return <VStack spacing={5}>
    {elapsedPeriods(now).map((period, index) => {
      const elapsed = Math.max(0, Math.min(1, period.progress))
      // 从左下方的零刻度，顺时针扫过 270° 到右下方的满刻度。
      const degrees = 135 + elapsed * 270
      const radians = degrees * Math.PI / 180
      return <HStack spacing={3}>
        <ZStack frame={{ width: 36, height: 32 }}>
          <Circle trim={{ from: 0, to: 0.75 }} stroke={{ shapeStyle: { light: '#E6E0D7', dark: '#403C37' }, strokeStyle: { lineWidth: 2.5, lineCap: 'round' } }} frame={{ width: 30, height: 30 }} rotationEffect={135} />
          <Circle trim={{ from: 0, to: elapsed * 0.75 }} stroke={{ shapeStyle: colors[index], strokeStyle: { lineWidth: 2.5, lineCap: 'round' } }} frame={{ width: 30, height: 30 }} rotationEffect={135} />
          {Array.from({ length: 9 }, (_, tick) => {
            const angle = 135 + tick * 270 / 8
            const rad = angle * Math.PI / 180
            return <Capsule fill={muted} frame={{ width: tick % 2 === 0 ? 3 : 2, height: 0.7 }} rotationEffect={angle} offset={{ x: Math.cos(rad) * 11, y: Math.sin(rad) * 11 }} />
          })}
          <Capsule fill={colors[index]} frame={{ width: 10, height: 1.4 }} rotationEffect={degrees} offset={{ x: Math.cos(radians) * 4, y: Math.sin(radians) * 4 }} />
          <Circle fill={colors[index]} frame={{ width: 3.5, height: 3.5 }} />
          <Text font={7} fontWeight="semibold" monospacedDigit offset={{ x: 0, y: 11 }}>{`${Math.floor(elapsed * 100)}%`}</Text>
        </ZStack>
        <Text font={9} foregroundStyle={muted}>{period.label.replace('本', '')}</Text>
      </HStack>
    })}
  </VStack>
}
export default function TimeCard() {
  const now = new Date()
  const info = todayInfo(now)
  const items = upcoming(now)
  const first = items[0]
  const small = Widget.family === 'systemSmall'
  const large = Widget.family === 'systemLarge' || Widget.family === 'systemExtraLarge'
  if (!first) return <Text widgetBackground={paper}>暂无待到来的节日</Text>
  return <VStack alignment="leading" spacing={large ? 12 : 9} padding={14} frame={{ maxWidth: Infinity, maxHeight: Infinity }} foregroundStyle={ink} widgetBackground={paper}>
    <HStack spacing={4}>
      <Text font={11} fontWeight="semibold">{info.date}</Text>
      <Text font={10} foregroundStyle={muted}>{info.week}</Text>
      <Spacer minLength={0} />
      {!small ? <Text font={10} foregroundStyle={muted}>{info.year}  {info.lunar}</Text> : null}
      {small ? <Image systemName="hourglass" font={10} foregroundStyle={accent} /> : null}
    </HStack>
    {small ? <VStack alignment="leading" spacing={6}>
      <Countdown item={first} small />
      <Text font={10} foregroundStyle={muted} lineLimit={1} minScaleFactor={0.8}>{info.lunar} · {info.term || info.astro}</Text>
    </VStack> : large ? <VStack alignment="leading" spacing={10}>
      <Countdown item={first} />
      <Divider />
      {items.slice(1, 6).map(item => <FestivalRow item={item} large />)}
    </VStack> : <HStack alignment="center" spacing={8}>
      <VStack alignment="center" spacing={7} frame={{ width: 76 }}>
        <Countdown item={first} centered />
        <Text font={9} foregroundStyle={muted} lineLimit={1} minScaleFactor={0.7}>{info.term || info.astro} · 好日可期</Text>
      </VStack>
      <Divider />
      <HStack alignment="top" spacing={8} frame={{ maxWidth: Infinity }}>
        <FestivalTimeline items={items.slice(1, 5)} />
        <FestivalTimeline items={upcomingTerms(now)} solar />
        <TimeProgress now={now} />
      </HStack>
    </HStack>}
  </VStack>
}
Widget.present(<TimeCard />, { policy: 'after', date: new Date(Date.now() + 30 * 60 * 1000) })
Script.exit()
