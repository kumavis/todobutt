const path = require('path')
const pull = require('pull-stream')
const ssbClient = require('ssb-client')
const config = require('ssb-config')
const ssbKeys = require('ssb-keys')
const ssbParty = require('ssb-party')
const { createStore } = require('redux')
const jsonDiffer = require('fast-json-patch')
const clone = require('clone')

const createMsg = require('./createMsg')
const createDeltaReducer = require('./delta').createReducer
const manifest = require('./manifest.json')


const defaultState = {
  items: {},
}

const keys = config.keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
console.log('config:', config)
const remote = `ws:localhost:${config.ws.port}~shs:${config.keys.public.split('.')[0]}`
console.log('remote:', remote)

ssbClient(
  keys,                // optional, defaults to ~/.ssb/secret
  {
    manifest,
    remote,
    caps: config.caps
  },
  onSbotReady
)

// ssbParty(onSbotReady)

function onSbotReady(err, sbot) {
  
  if (err) throw err

  let store = createStore(createDeltaReducer({
    contentType: 'action',
  }))

  store.subscribe(() => {
    // console.log(JSON.stringify(store.getState(), null, 2))
    const { items } = store.getState()
    const state = Object.keys(items).map((key) => {
      const item = items[key]
      return item.state
    })
    console.log(JSON.stringify(state, null, 2))
  })

  const thing = newThing({ label: 'pet snek' })
  const id = thing.id

  const messages = [
    createMsg({ type: 'action', data: thing }),
    createMsg({ type: 'action', data: { id, patch: createDelta({ label: 'pet 2 snekz' }) }}),
    createMsg({ type: 'action', data: { id, patch: createDelta({ complete: true }) }}),
    createMsg({ type: 'action', data: { id, patch: createDelta({ note: 'looks good' }) }}),
  ]

  // feed all messages into state atom
  pull(
    // sbot.createFeedStream(),
    pull.values(messages),
    pull.drain(function (msg) {
      store.dispatch({ type: 'sbot', data: msg })
    })
  )

}

function playHistory(history) {
  return history.reduce((val, entry) => jsonDiffer.applyPatch(val, entry).newDocument, {})
}

function newThing(state) {
  return { id: newId(), patch: createDelta(state) }
}

function createDelta(update){
  return jsonDiffer.compare({}, update)
}

function newId() {
  return Math.floor(Math.random()*1e10)
}