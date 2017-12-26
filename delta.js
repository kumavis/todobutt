const createMsg = require('./createMsg')

const pull = require('pull-stream')
const ssbClient = require('ssb-client')
const { createStore } = require('redux')
const jsonDiffer = require('fast-json-patch')
const clone = require('clone')

const defaultState = {
  items: {},
}

ssbClient(function (err, sbot) {
  if (err) throw err

  let store = createStore(function (state = defaultState, action) {

    if (action.type !== 'sbot') return state
    
    const msg = action.data
    const content = msg.value.content

    switch (content.type) {
      
      case 'action':
        const items = clone(state.items)
        const id = content.data.id
        if (!items[id]) items[id] = { state: {}, history: [] }
        const item = items[id]
        // update history
        item.history.push(msg)
        item.history.sort((a,b) => a.value.timestamp - b.value.timestamp)
        // update state
        const patchHistory = item.history.map(entry => entry.value.content.data.patch)
        // console.log(item.history)
        // console.log(patchHistory)
        const itemState = playHistory(patchHistory)
        item.state = itemState
        return Object.assign({}, state, { items })
      
      default:
        return state

    }
  })

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

})

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