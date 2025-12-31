import { agrid } from './agrid'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Agrid Web Example</h1>
        <div className="Buttons">
          <button className="Button" onClick={() => agrid.identify('user-123')}>
            Identify
          </button>
          <button className="Button" onClick={() => agrid.capture('test_event', { prop: 'value' })}>
            Capture Event
          </button>
        </div>
      </header>
    </div>
  )
}

export default App
