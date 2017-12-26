const pull = require('pull-stream')
const ssbClient = require('ssb-client')
const { createStore } = require('redux')

const defaultState = {
  todos: [],
  actions: {},
}

// create a scuttlebot client using default settings
// (server at localhost:8080, using key found at ~/.ssb/secret)
ssbClient(function (err, sbot) {
  if (err) throw err

  // Create a Redux store holding the state of your app.
  // Its API is { subscribe, dispatch, getState }.
  let store = createStore(function (state = defaultState, action) {

    if (action.type !== 'sbot') return state
    
    const msg = action.data
    const content = msg.value.content
    console.log(msg)

    // if (!['todo', 'todoaction'].includes(content.type)) return state

    switch (content.type) {
      
      case 'todo':
        const todos = state.todos.slice()
        const data = content
        todos.push({ data, msg })
        return Object.assign({}, state, { todos })
      
      case 'todoaction':
        const todoAction = content.action
        if (!todoAction) return state
        const link = content.action.link
        if (!link) return state
        // update action's history
        let actionHistory = state.actions[link] || []
        actionHistory = [...actionHistory, msg]
        const actions = Object.assign({}, state.actions)
        actions[link] = actionHistory
        // update item state
        const item = state.todos.find((entry) => entry.msg.key === link)
        if (item) {
          item.data.complete = content.action.value
        }
        return Object.assign({}, state, { actions })
      
      default:
        return state

    }
  })

  store.subscribe(() => {
    // console.log(JSON.stringify(store.getState(), null, 2))
    const { todos } = store.getState()
    const todoState = todos.map(entry => entry.data)
    console.log(JSON.stringify(todoState, null, 2))
  })

  // feed all messages into state atom
  pull(
    sbot.createFeedStream(),
    pull.drain(function (msg) {
      store.dispatch({ type: 'sbot', data: msg })
    })
  )

})