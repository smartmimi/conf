import { Notification, Widget, Script } from 'scripting'
import { upcoming } from './model'

async function enableReminders() {
  const now = new Date()
  const items = upcoming(now).filter(item => {
    const [y, m, d] = item.date.split('-').map(Number)
    return new Date(y, m - 1, d, 6).getTime() > now.getTime()
  }).slice(0, 8)
  // 只替换本脚本的提醒，避免重复安排，也不影响其他脚本。
  await Notification.removeAllPendingsOfCurrentScript()
  let count = 0
  let lastDate = '暂无'
  for (const item of items) {
    const [year, month, day] = item.date.split('-').map(Number)
    const date = new DateComponents()
    date.year = year
    date.month = month
    date.day = day
    date.hour = 6
    date.minute = 0
    date.second = 0
    const ok = await Notification.schedule({
      title: `今天是${item.name} 🎉`,
      body: `${item.date} · 今天是${item.name}。`,
      threadIdentifier: 'time-card-festivals',
      trigger: new CalendarNotificationTrigger({ dateMatching: date, repeats: false }),
    })
    if (ok) {
      count++
      lastDate = item.date
    }
  }
  await Dialog.alert({
    title: count === items.length ? '节日提醒已安排' : '提醒未全部安排成功',
    message: `已安排 ${count} 个节日，在当天早上 6 点提醒。\n最后安排至 ${lastDate}。\n可再次运行脚本更新；若失败，请检查 Scripting 的通知权限。`,
  })
}
async function main() {
  try {
    const choice = await Dialog.actionSheet({
      title: '时间卡',
      message: '好日可期 · 每一天都值得珍惜',
      actions: [
        { label: '预览中号小组件' },
        { label: '预览小号小组件' },
        { label: '预览大号小组件' },
        { label: '开启 / 更新未来 8 个节日提醒' },
        { label: '关闭节日提醒', destructive: true },
      ],
    })
    if (choice === 0 || choice === 1 || choice === 2) {
      await Widget.preview({ family: (['systemMedium', 'systemSmall', 'systemLarge'] as const)[choice] })
    } else if (choice === 3) {
      await enableReminders()
    } else if (choice === 4) {
      await Notification.removeAllPendingsOfCurrentScript()
      await Dialog.alert({ title: '已关闭', message: '时间卡的待发送节日提醒已取消。' })
    }
  } catch (error) {
    await Dialog.alert({ title: '时间卡', message: String(error) })
  } finally {
    Script.exit()
  }
}
main()
