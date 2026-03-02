export interface User {
  id: string
  email: string
  name?: string
  role?: string
}

export interface Box {
  id: string
  title: string
  description?: string
  dockerImage: string
}

export type SandboxStatus = 'PENDING' | 'RUNNING' | 'STOPPED' | 'ERROR'

export interface Sandbox {
  id: string
  boxId: string
  userId: string
  status: SandboxStatus
  port?: number
  containerId?: string
}
