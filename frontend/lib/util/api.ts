import axios from './axios'
import type { AxiosResponse } from 'axios'
import { Integration } from './types'

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

export default { integrations }
