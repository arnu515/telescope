import type { NextApiHandler } from 'next'
import { getSession } from '../../../../../lib/session'
import api, { FetchError } from '../../../../../lib/util/api'

const handler: NextApiHandler = async (req, res) => {
  const credId = typeof req.query.id === 'string' ? req.query.id : null
  const intgId = typeof req.query.slug === 'string' ? req.query.slug : null
  const redir =
    typeof req.query.redirect === 'string' ? req.query.redirect : '/'

  if (!intgId) {
    const json = {
      error: 'Not found',
      error_description: 'Integration not found',
    }
    res.redirect(redir + '?' + new URLSearchParams(json).toString())
    return
  }

  const session = await getSession(req, res)
  if (!session || !session.token) {
    const json = { error: 'Unauthorized', error_description: 'No session' }
    res.redirect(redir + '?' + new URLSearchParams(json).toString())
    return
  }

  try {
    if (credId) {
      // delete credential
      await api.developers.integrations.credentials.delete(
        session.token,
        intgId,
        credId
      )
      res.redirect(redir)
    } else {
      // create credential
      const { data } = await api.developers.integrations.credentials.create(
        session.token,
        intgId
      )
      res.redirect(
        redir + '?' + new URLSearchParams({ secret: data.secret }).toString()
      )
    }
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
