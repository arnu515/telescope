export type Integration = {
  id: string
  name: string
  baseUrl: string
  addUrl: string
  key: string
  ownerId: string
  isVerified: boolean
  createdAt: Date
}

export type Developer = {
  id: string
  name: string
  email: string
  avatarUrl: string
  username: string
  githubId: string
  createdAt: Date
}

export type IntegrationCredentials = {
  id: string
  integrationId: string
  secret: string
  createdAt: Date
  uses: number
}

export type Call = {
  id: string
  fromId: string
  toId: string
  integrationId: string
  integrationData: Record<string, any>
  createdAt: Date
  isActive: boolean
  expiresAt: Date | null
}

export interface ErrorObject {
  error: string
  error_description: string
}
