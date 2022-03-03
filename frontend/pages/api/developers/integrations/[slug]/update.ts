import type { NextApiHandler } from 'next'
import { getSession } from '../../../../../lib/session'
import api, { FetchError } from '../../../../../lib/util/api'

const handler: NextApiHandler = async (req, res) => {
  const body = req.body
  console.log(body)
  delete body.id
  const redir = body.redirect || null
  console.log(redir)
  delete body.redirect

  const session = await getSession(req, res)
  if (!session || !session.token) {
    const json = { error: 'Unauthorized', error_description: 'No session' }
    if (redir) res.redirect(redir + '?' + new URLSearchParams(json).toString())
    else res.status(401).json(json)
    return
  }

  if (typeof req.query.slug !== 'string') {
    const json = {
      error: 'Not found',
      error_description: 'Integration not found',
    }
    if (redir) res.redirect(redir + '?' + new URLSearchParams(json).toString())
    else res.status(404).json(json)
    return
  }

  console.log(session)
  try {
    const { data } = await api.developers.integrations.update(
      session.token,
      req.query.slug,
      body
    )
    if (redir) res.redirect(redir + '?' + new URLSearchParams({}).toString())
    else res.status(200).json(data)
    return
  } catch (e) {
    if (!(e instanceof FetchError)) {
      const json = {
        error: 'An error occured',
        error_description: 'An error occured',
      }
      if (redir)
        res.redirect(redir + '?' + new URLSearchParams(json).toString())
      res.status(500).json(json)
      return
    }
    if (e.status === 401) {
      session.dev = null
      session.token = null
    }
    const json = {
      error: e.error || 'An error occured',
      error_description: e.error_description || 'An error occured',
    }
    if (redir) res.redirect(redir + '?' + new URLSearchParams(json).toString())
    else res.status(e.status || 500).json(json)
    return
  }
}

export default handler
