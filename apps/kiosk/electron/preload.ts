import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 파일 읽기 (스크린세이버 설정 로드 등에 사용)
  readFile: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke('read-file', filePath),
})

// renderer에서 호출 예시:
// const json = await window.electronAPI.readFile('/path/to/screensaver.json')
// const config: ScreensaverConfig = JSON.parse(json ?? '{}')
