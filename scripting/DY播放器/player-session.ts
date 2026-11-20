const CACHE_KEY = "dy-player.temporary-videos.v1"
export type VideoEntry = {
  id: string
  asset: PHAsset
  player: AVPlayer | null
  cover: UIImage | null
  path: string | null
  ready: boolean
  error: string
  pending: Promise<void> | null
}

export class PlayerSession {
  closing = false
  refreshing = false
  activeID: string | null = null
  paused = false
  previewID: string | null = null
  entries = new Map<string, VideoEntry>()
  onChange: (() => void) | null = null
  private wanted = new Set<string>()
  private tasks = new Set<Promise<void>>()
  private exportQueue: Promise<unknown> = Promise.resolve()
  private paths = new Set<string>(Storage.get<string[]>(CACHE_KEY) ?? [])
  private listeners = new Set<() => void>()
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null
  private maintenanceTimer: ReturnType<typeof setTimeout> | null = null
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  private emit() {
    if (this.closing) return
    this.onChange?.()
    for (const listener of this.listeners) listener()
  }
  private scheduleClean() {
    if (this.cleanupTimer !== null) clearTimeout(this.cleanupTimer)
    this.cleanupTimer = setTimeout(() => {
      this.cleanupTimer = null
      void this.cleanAsync()
    }, 700)
  }
  private async cleanAsync() {
    let changed = false
    for (const path of [...this.paths]) {
      if ([...this.entries.values()].some(entry => entry.path === path)) continue
      try {
        if (await FileManager.exists(path)) {
          if ([...this.entries.values()].some(entry => entry.path === path)) continue
          await FileManager.remove(path)
        }
        this.paths.delete(path)
        changed = true
      } catch { /* 保留失败记录供手动清理重试。 */ }
    }
    if (changed) this.persist()
  }
  private persist() {
    if (!Storage.set(CACHE_KEY, [...this.paths])) console.error("临时视频清单保存失败")
  }
  clean(): number {
    const used = new Set([...this.entries.values()].map(e => e.path))
    let failures = 0
    for (const path of this.paths) {
      if (used.has(path)) continue
      try {
        if (FileManager.existsSync(path)) FileManager.removeSync(path)
        this.paths.delete(path)
      } catch { failures++ }
    }
    this.persist()
    return failures
  }
  private drop(entry: VideoEntry) {
    entry.player?.dispose()
    entry.player = null
    if (this.entries.get(entry.id) === entry) this.entries.delete(entry.id)
  }
  private valid(entry: VideoEntry) {
    return !this.closing && this.wanted.has(entry.id) && this.entries.get(entry.id) === entry
  }
  preview(id: string | null) {
    const target = id && id !== this.activeID && this.wanted.has(id) ? id : null
    if (this.closing || this.previewID === target) return
    this.previewID = target
    this.syncPlayback()
    this.emit()
  }
  private syncPlayback() {
    // 先静音非当前页，再启动/暂停，避免切换瞬间两条同时出声。
    for (const entry of this.entries.values()) {
      if (entry.player && (entry.id !== this.activeID || this.paused)) entry.player.volume = 0
    }
    for (const entry of this.entries.values()) {
      if (!entry.player) continue
      const active = entry.id === this.activeID && !this.paused
      entry.player.volume = active ? 1 : 0
      if (active || entry.id === this.previewID) {
        if (entry.player.timeControlStatus === TimeControlStatus.paused) entry.player.play()
      } else if (entry.player.timeControlStatus !== TimeControlStatus.paused) {
        entry.player.pause()
      }
    }
  }
  private ensure(asset: PHAsset): Promise<void> {
    const existing = this.entries.get(asset.localIdentifier)
    if (existing) return existing.pending ?? Promise.resolve()
    const entry: VideoEntry = { id: asset.localIdentifier, asset, player: null, cover: null, path: null, ready: false, error: "", pending: null }
    this.entries.set(entry.id, entry)
    const task = (async () => {
      try {
        // 封面不阻塞当前视频导出。
        void asset.requestImage({ targetWidth: 480, targetHeight: 854, contentMode: "aspectFit", allowNetworkAccess: false })
          .then(image => { if (this.valid(entry)) { entry.cover = image; this.emit() } })
          .catch(() => {})
        if (!this.valid(entry)) return
        const exporting = this.exportQueue.then(() => this.valid(entry)
          ? asset.requestVideoURL({ version: "current", allowNetworkAccess: true }) : null)
        this.exportQueue = exporting.catch(() => null)
        const path = await exporting
        if (!path && !this.valid(entry)) return
        if (!path) throw new Error("无法读取视频，请检查 iCloud 或相册权限")
        this.paths.add(path)
        this.persist()
        if (!this.valid(entry)) { this.scheduleClean(); return }
        entry.path = path
        const player = new AVPlayer()
        entry.player = player
        player.volume = 0
        player.numberOfLoops = -1
        // 必须先注册回调，再 setSource；相邻页只准备，不自动出声。
        player.onReadyToPlay = () => {
          if (!this.valid(entry)) return
          entry.ready = true
          this.syncPlayback()
          this.emit()
        }
        player.onError = message => {
          if (!this.valid(entry)) return
          entry.error = message
          this.emit()
        }
        if (!player.setSource(path)) throw new Error("视频格式无法播放")
        this.syncPlayback()
        this.emit()
      } catch (error) {
        if (this.valid(entry)) {
          entry.player?.dispose()
          entry.player = null
          entry.path = null
          entry.error = String(error)
          this.emit()
        }
      } finally {
        entry.pending = null
        this.scheduleClean()
      }
    })()
    entry.pending = task
    this.tasks.add(task)
    void task.finally(() => this.tasks.delete(task))
    return task
  }
  focus(assets: PHAsset[], index: number) {
    if (this.closing || !assets[index]) return
    const id = assets[index].localIdentifier
    if (this.activeID !== id) this.paused = false
    this.activeID = id
    this.previewID = null
    const nearby = [assets[index], assets[index + 1], assets[index - 1]].filter((a): a is PHAsset => !!a)
    this.wanted = new Set(nearby.map(a => a.localIdentifier))
    // 落位先交接声音；远端释放与新相邻导出延后，避免与画布提交挤在同一帧。
    this.syncPlayback()
    if (this.maintenanceTimer !== null) clearTimeout(this.maintenanceTimer)
    // 当前页导出优先，再顺序准备下一条、上一条，避免争抢 Photos 导出资源。
    const prepare = async () => {
      for (const asset of nearby) {
        if (this.closing || this.activeID !== id) return
        await this.ensure(asset)
      }
    }
    // 首次打开仍立即加载；已经预播放的页只需切换音量。
    if (!this.entries.get(id)?.player) void this.ensure(assets[index])
    this.maintenanceTimer = setTimeout(() => {
      this.maintenanceTimer = null
      if (this.closing || this.activeID !== id) return
      for (const entry of [...this.entries.values()]) if (!this.wanted.has(entry.id)) this.drop(entry)
      this.scheduleClean()
      void prepare()
    }, 240)
    this.emit()
  }
  toggle() {
    this.paused = !this.paused
    this.syncPlayback()
    this.emit()
  }
  retry(assets: PHAsset[], index: number) {
    const entry = this.entries.get(assets[index].localIdentifier)
    if (entry?.pending) return
    if (entry) this.drop(entry)
    this.focus(assets, index)
  }
  release() {
    if (this.maintenanceTimer !== null) clearTimeout(this.maintenanceTimer)
    this.maintenanceTimer = null
    this.activeID = null
    this.previewID = null
    this.wanted.clear()
    for (const entry of [...this.entries.values()]) this.drop(entry)
    this.clean()
  }
  async close() {
    this.closing = true
    this.onChange = null
    this.listeners.clear()
    if (this.cleanupTimer !== null) clearTimeout(this.cleanupTimer)
    this.release()
    let timeout: ReturnType<typeof setTimeout> | undefined
    await Promise.race([
      Promise.allSettled([...this.tasks]),
      new Promise<void>(resolve => {
        timeout = setTimeout(() => {
          console.error("Photos 导出尚未结束，退出清理等待已达 15 秒；未返回的文件路径无法追踪。")
          resolve()
        }, 15000)
      }),
    ])
    if (timeout !== undefined) clearTimeout(timeout)
    this.clean()
  }
}
