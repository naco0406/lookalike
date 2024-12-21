import './App.css'
import FaceDetection from './components/FaceDetection'

function App() {
  return (
    <div className="App">
      <FaceDetection />
      {/* <EmbeddingGenerator /> */}
      <footer className="text-center text-gray-500 text-xs mt-4">
        © 2024 Naco. All rights reserved.
      </footer>
    </div>
  )
}

export default App
