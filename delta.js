const createMsg = require('./createMsg')

const pull = require('pull-stream')
const ssbClient = require('ssb-client')
const { createStore } = require('redux')
const jsonDiffer = require('fast-json-patch')
const clone = require('clone')

module.exports = {
  createReducer,
  newThing,
}

const defaultState = {
  items: {},
}

function createReducer({ contentType }) {
  return function deltaReducer(state = defaultState, action) {

    if (action.type !== 'sbot') return state
    
    const msg = action.data
    const content = msg.value.content

    if (content.type !== contentType) {
      return state
    }
      
    
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
    
  }
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