import axios from './axios'
import type { AxiosResponse } from 'axios'
import { Developer, Integration } from './types'

export class FetchError extends Error {
  constructor(
    public error: string,
    public error_description: string,
    public status: number,
    public res: AxiosResponse<any, any>
  ) {
    super(`${error}: ${error_description}`)
  }
}

type MaybePromise<T> = T | Promise<T>

async function request<X = any, Y = any>(
  fn: () => MaybePromise<AxiosResponse<X, Y>>
) {
  const res = await fn()
  if (!res.status.toString().startsWith('2')) {
    console.log(res)
    throw new FetchError(
      (res.data as any).error || 'An unknown error occured',
      (res.data as any).error_description || 'An unknown error occured',
      res.status,
      res
    )
  } else return res
}

export const integrations = {
  public: () =>
    request<{ integrations: Integration[] }>(() =>
      axios.get('/api/integrations/public')
    ),
  publicOne: (id: string) =>
    request<{ integration: Integration }>(() =>
      axios.get(`/api/integrations/public/${id}`)
    ),
}

export const developers = {
  me: (token: string) =>
    request<{ dev: Developer }>(() =>
      axios.get('/api/developers/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
    ),
  integrations: {
    all: (token: string) =>
      request<{ integrations: Integration[] }>(() =>
        axios.get('/api/developers/integrations', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ),
    one: (token: string, id: string) =>
      request<{ integration: Integration }>(() =>
        axios.get('/api/developers/integrations/' + id, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ),
    update: (token: string, id: string, body: any) =>
      request<{ integration: Integration }>(() =>
        axios.put('/api/developers/integrations/' + id, {
          headers: { Authorization: `Bearer ${token}` },
          data: body,
        })
      ),
  },
}

export default { integrations, developers }
