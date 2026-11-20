import {
  Navigation, NavigationStack, Script, ScrollView, LazyVGrid, VStack, HStack, ZStack,
  Text, Button, Image, Spacer, ProgressView, VideoPlayer,
  useState, useEffect, useMemo, TapGesture, DragGesture, GeometryReader,
} from "scripting"
import { PlayerSession } from "./player-session"

const session = new PlayerSession()
function duration(seconds: number) {
  const n = Math.floor(Number.isFinite(seconds) ? Math.max(0, seconds) : 0)
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`
}
function dateLabel(asset: PHAsset) {
  return asset.creationDate ? new Date(asset.creationDate).toLocaleString() : "相册视频"
}
function VideoThumbnail({ asset, size, select }: { asset: PHAsset; size: number; select: () => void }) {
  const [image, setImage] = useState<UIImage | null>(null)
  useEffect(() => {
    let live = true
    asset.requestImage({ targetWidth: 300, targetHeight: 300, contentMode: "aspectFill", allowNetworkAccess: false })
      .then(value => { if (live) setImage(value) }).catch(() => {})
    return () => { live = false }
  }, [asset.localIdentifier])
  return <Button action={select} buttonStyle="plain"
    accessibilityLabel={`${dateLabel(asset)}，时长 ${duration(asset.duration)}`}>
    <ZStack frame={{ width: size, height: size }} background="secondarySystemBackground" clipped
      overlay={{ alignment: "bottomTrailing", content: <Text font={11} bold monospacedDigit
        foregroundStyle="white" padding={4} background="black">{duration(asset.duration)}</Text> }}>
      {image ? <Image image={image} resizable scaleToFill frame={{ width: size, height: size }} clipped />
        : <Image systemName="video.fill" foregroundStyle="secondaryLabel" />}
    </ZStack>
  </Button>
}

function VideoPage({ asset, width, height, fullscreen, toggleFullscreen, retry }: {
  asset: PHAsset; width: number; height: number; fullscreen: boolean;
  toggleFullscreen: () => void; retry: () => void;
}) {
  const [, updateEntry] = useState(0)
  useEffect(() => {
    const refresh = () => updateEntry(value => value + 1)
    const unsubscribe = session.subscribe(refresh)
    // 补读渲染到订阅之间已经完成的预加载结果。
    refresh()
    return unsubscribe
  }, [asset.localIdentifier])
  const entry = session.entries.get(asset.localIdentifier)
  const active = session.activeID === asset.localIdentifier
  const previewing = session.previewID === asset.localIdentifier
  const [elapsed, setElapsed] = useState(0)
  const [total, setTotal] = useState(asset.duration)
  const [picture, setPicture] = useState(false)
  const [showLoading, setShowLoading] = useState(false)
  const player = entry?.player
  const ratio = asset.pixelWidth > 0 && asset.pixelHeight > 0 ? asset.pixelWidth / asset.pixelHeight : width / Math.max(1, height)
  const renderWidth = fullscreen ? Math.max(width, height * ratio) : width
  const renderHeight = fullscreen ? Math.max(height, width / ratio) : height
  // 扩大原比例播放层，由外层按屏幕尺寸裁切；不拉伸画面。
  const videoSurface = useMemo(() => player
    ? <VideoPlayer key="video-surface" player={player} frame={{ width: renderWidth, height: renderHeight }} ignoresSafeArea allowsHitTesting={false} />
    : null, [player, renderWidth, renderHeight])
  useEffect(() => {
    setShowLoading(false)
    if (!active || picture || entry?.error) return
    const timer = setTimeout(() => setShowLoading(true), 700)
    return () => clearTimeout(timer)
  }, [active, picture, player, entry?.error])
  useEffect(() => {
    if ((!active && !previewing) || !player || picture) return
    // 在封面下等待播放时间推进，较快捕捉启动，避免半秒后突然跳画面。
    const timer = setInterval(() => {
      if (session.closing || session.entries.get(asset.localIdentifier)?.player !== player) return
      if (player.timeControlStatus === TimeControlStatus.playing && player.currentTime >= 0.08) {
        setPicture(true)
        clearInterval(timer)
      }
    }, 80)
    return () => clearInterval(timer)
  }, [active, previewing, player, picture])
  useEffect(() => {
    if (!player) { setPicture(false); return }
    if (!active) return
    // 原生播放视图挂载后再次提交当前页的播放意图。
    if (!session.paused && player.timeControlStatus === TimeControlStatus.paused) player.play()
    const update = () => {
      if (session.closing || session.entries.get(asset.localIdentifier)?.player !== player) return
      const seconds = Math.floor(player.currentTime)
      setElapsed(previous => previous === seconds ? previous : seconds)
      const length = Math.floor(player.duration || asset.duration)
      setTotal(previous => previous === length ? previous : length)
    }
    update()
    const timer = setInterval(update, 500)
    return () => clearInterval(timer)
  }, [player, active])
  return <ZStack frame={{ width, height }} clipped background="black" contentShape="rect"
    onTapGesture={() => { if (active) session.toggle() }}
    overlay={{ alignment: "topTrailing", content: <Text font="caption" monospacedDigit
      foregroundStyle="yellow" padding={{ top: fullscreen ? 54 : 10, trailing: 12, bottom: 10, leading: 10 }} allowsHitTesting={false}
    >{`${duration(elapsed)} / ${duration(total)}`}</Text> }}>
    {videoSurface}
    {entry?.cover ? <Image key="video-cover" image={entry.cover} resizable scaleToFit={!fullscreen} scaleToFill={fullscreen}
      frame={{ width, height }} background="black" allowsHitTesting={false}
      opacity={picture ? 0 : 1} animation={{ animation: Animation.easeOut(0.18), value: picture }} /> : null}
    {active && !picture && showLoading && !entry?.error ? <VStack spacing={10}>
      <ProgressView />
      <Text font="caption" foregroundStyle="white">{player ? "正在开始播放…" : "正在读取视频…"}</Text>
    </VStack> : null}
    {entry?.error ? <VStack padding spacing={12}><Text foregroundStyle="orange">{entry.error}</Text><Button title="重试" action={retry} /></VStack> : null}
    <ZStack frame={{ width: Math.min(width, 220), height: Math.min(height, 220) }} contentShape="rect"
      highPriorityGesture={TapGesture(2).onEnded(toggleFullscreen)}><Text opacity={0}>双击全屏</Text></ZStack>
  </ZStack>
}

function CanvasPager({ assets, index, width, height, fullscreen, select, toggleFullscreen }: {
  assets: PHAsset[]; index: number; width: number; height: number; fullscreen: boolean;
  select: (next: number) => void; toggleFullscreen: () => void;
}) {
  const [canvas, setCanvas] = useState({ origin: index, offset: 0 })
  const control = useMemo(() => ({ locked: false, alive: true, generation: 0,
    nextAllowedAt: 0, dragY: 0, lastDragAt: 0,
    gesture: "none" as "none" | "vertical" | "ignored", gestureGeneration: 0 }), [])
  useEffect(() => () => { control.alive = false; control.generation++; session.preview(null) }, [])
  useEffect(() => {
    control.generation++
    control.locked = false
    setCanvas(previous => previous.origin === index && previous.offset === 0
      ? previous : { origin: index, offset: 0 })
  }, [index, width, height])
  async function settle(distance: number, predicted: number) {
    if (control.locked || height <= 0) return
    control.locked = true
    const generation = control.generation
    // 预测位移最多补偿一小段，避免轻甩直接跨过整屏。
    const boundedPrediction = distance + Math.max(-height * 0.12, Math.min(height * 0.12, predicted - distance))
    const travel = Math.abs(distance) >= height * 0.2 ? distance : boundedPrediction
    const direction = Math.abs(travel) > height * 0.2 ? (travel < 0 ? 1 : -1) : 0
    const next = Math.max(0, Math.min(assets.length - 1, index + direction))
    session.preview(next !== index ? assets[next].localIdentifier : null)
    try {
      await withAnimation(Animation.easeOut(0.36), "removed", () => setCanvas({ origin: index, offset: -(next - index) * height }))
      if (!control.alive || generation !== control.generation || session.closing) return
      // 原点和位移原子更新，共享页面的屏幕位置不变，不依赖跨组件批量更新。
      setCanvas({ origin: next, offset: 0 })
      if (next !== index) {
        control.nextAllowedAt = Date.now() + 450
        select(next)
      }
    } catch (error) {
      console.error(`翻页动画失败：${String(error)}`)
      if (control.alive && generation === control.generation) setCanvas({ origin: index, offset: 0 })
    } finally {
      if (control.alive && generation === control.generation) {
        control.locked = false
        session.preview(null)
      }
    }
  }
  return <ZStack frame={{ width, height }} clipped background="black" contentShape="rect"
    simultaneousGesture={DragGesture().onChanged(event => {
      if (control.gesture === "none") {
        control.gestureGeneration = control.generation
        control.dragY = 0
        control.lastDragAt = Date.now() - 16
        control.gesture = !control.locked && Date.now() >= control.nextAllowedAt && Math.abs(event.translation.height) > Math.abs(event.translation.width)
          ? "vertical" : "ignored"
      }
      if (control.gesture !== "vertical" || control.locked || control.gestureGeneration !== control.generation) return
      let y = Math.max(-height, Math.min(height, event.translation.height))
      if ((index === 0 && y > 0) || (index === assets.length - 1 && y < 0)) y *= 0.25
      const now = Date.now()
      const dt = Math.min(50, Math.max(1, now - control.lastDragAt)) / 1000
      // 最多每秒移动 1.6 个屏高，快速甩动不会瞬间跳满一屏。
      const maxStep = height * 1.6 * dt
      y = control.dragY + Math.max(-maxStep, Math.min(maxStep, y - control.dragY))
      control.dragY = y
      control.lastDragAt = now
      const target = Math.abs(y) > 16 ? assets[index + (y < 0 ? 1 : -1)] : null
      session.preview(target?.localIdentifier ?? null)
      setCanvas({ origin: index, offset: y })
    }).onEnded(event => {
      const accepted = control.gesture === "vertical" && control.gestureGeneration === control.generation && !control.locked
      control.gesture = "none"
      if (accepted) void settle(control.dragY, event.predictedEndTranslation.height)
    })}>
    {[0, 1, 2].map(slot => {
      // 固定数组位置：同一视频始终位于 index % 3 对应的原生容器。
      const i = [index - 1, index, index + 1].find(candidate =>
        candidate >= 0 && candidate < assets.length && candidate % 3 === slot)
      return <ZStack key={`video-slot-${slot}`} frame={{ width, height }}
        offset={{ x: 0, y: i === undefined ? height * 2 : (i - canvas.origin) * height + canvas.offset }}>
        {i !== undefined ? <VideoPage key={assets[i].localIdentifier} asset={assets[i]}
          width={width} height={height} fullscreen={fullscreen}
          toggleFullscreen={() => { if (!control.locked) toggleFullscreen() }} retry={() => session.retry(assets, i)} /> : null}
      </ZStack>
    })}
  </ZStack>
}

function App() {
  const dismiss = Navigation.useDismiss()
  const [assets, setAssets] = useState<PHAsset[]>([])
  const [index, setIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [fullscreen, setFullscreen] = useState(false)
  const [, redraw] = useState(0)
  useEffect(() => {
    session.onChange = () => redraw(value => value + 1)
    void refresh()
    return () => { session.onChange = null }
  }, [])
  async function refresh() {
    if (session.refreshing || session.closing || session.activeID) return
    session.refreshing = true
    setLoading(true)
    try {
      const result = await Photos.fetchAssets({ mediaType: "video", sortBy: "creationDate", ascending: false })
      if (session.closing) return
      setAssets(result)
      const status = Photos.authorizationStatus()
      setMessage(status === "denied" || status === "restricted" ? "请在系统设置中允许 Scripting 访问照片。"
        : status === "limited" ? "仅显示已授权的视频，可到系统设置调整访问范围。"
        : result.length ? "" : "没有可访问的视频。")
    } catch (error) { if (!session.closing) setMessage(String(error)) }
    finally { session.refreshing = false; if (!session.closing) setLoading(false) }
  }
  function select(next: number) {
    if (session.refreshing || session.closing || next < 0 || next >= assets.length) return
    if (index !== next) setIndex(next)
    if (session.activeID !== assets[next].localIdentifier) session.focus(assets, next)
  }
  function back(clear = false) {
    session.release()
    setIndex(-1)
    setFullscreen(false)
    const failures = session.clean()
    setMessage(failures ? `${failures} 个临时文件未能删除，可再次清理。` : clear ? "已清理视频缓存；尚在导出的文件返回后会自动删除。" : "")
  }
  const toolbar = {
    cancellationAction: <Button title={index >= 0 ? "相册" : "关闭"} action={() => index >= 0 ? back() : dismiss()} />,
    primaryAction: <Button title="清理缓存" action={() => back(true)} />,
  }
  return <NavigationStack statusBarHidden={fullscreen} persistentSystemOverlays={index >= 0 ? "hidden" : "visible"}
    navigationContainerBackground={index >= 0 ? "black" : "systemBackground"}
    background={index >= 0 ? "black" : "systemBackground"}>
    {index < 0 ? <GeometryReader navigationTitle="相册播放器" navigationBarTitleDisplayMode="inline" toolbar={toolbar}>{geometry => {
      const size = Math.max(1, (geometry.size.width - 16 - 3 * 4) / 4)
      return <ScrollView><VStack spacing={12} padding={{ horizontal: 8, vertical: 12 }}>
      <VStack alignment="leading" spacing={8}>
        <Text font="headline">选择一条，循环播放</Text>
        <Text font="subheadline" foregroundStyle="secondaryLabel">上下滑动整页切换 · 双击中央全屏</Text>
        <HStack><Text font="caption">{`${assets.length} 个视频`}</Text><Spacer /><Button title="刷新" disabled={loading} action={() => { void refresh() }} /></HStack>
      </VStack>
      {loading ? <ProgressView /> : null}
      {message ? <Text foregroundStyle="secondaryLabel">{message}</Text> : null}
      <LazyVGrid columns={[0, 1, 2, 3].map(() => ({ size, spacing: 4 }))} spacing={4}>
        {assets.map((asset, i) => <VideoThumbnail key={asset.localIdentifier} asset={asset} size={size} select={() => select(i)} disabled={loading} />)}
      </LazyVGrid>
      <Text font="caption" foregroundStyle="secondaryLabel">保留当前及相邻视频，离开后自动清理。iCloud 视频首次播放可能需要下载。</Text>
    </VStack></ScrollView>
    }}</GeometryReader> : <VStack spacing={0} background="black" foregroundStyle="white"
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      ignoresSafeArea={fullscreen ? true : { edges: "bottom" }}
      bottomBarVisibility="hidden"
      navigationTitle={`${index + 1} / ${assets.length}`} navigationBarTitleDisplayMode="inline" toolbar={toolbar}
      navigationBarVisibility={fullscreen ? "hidden" : "visible"}>
      <GeometryReader>{geometry => <CanvasPager
        assets={assets} index={index} width={geometry.size.width} height={geometry.size.height}
        fullscreen={fullscreen} select={select} toggleFullscreen={() => setFullscreen(value => !value)}
      />}</GeometryReader>
    </VStack>}
  </NavigationStack>
}
async function main() {
  try {
    session.clean()
    await SharedAudioSession.setCategory("playback", [])
    await SharedAudioSession.setActive(true)
    await Navigation.present({ element: <App />, modalPresentationStyle: "fullScreen" })
  } finally {
    session.closing = true
    session.release()
    try { await SharedAudioSession.setActive(false) } catch (error) { console.error(String(error)) }
    try { await session.close() } catch (error) { console.error(String(error)) }
    Script.exit()
  }
}
void main()
