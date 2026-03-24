import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// server/ 디렉토리 절대 경로: process.cwd()와 무관하게 항상 일정함
export const SERVER_DIR = join(__dirname, '..')

// 업로드 저장 루트. UPLOAD_DIR 환경변수로 재정의 가능
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(SERVER_DIR, 'uploads')
