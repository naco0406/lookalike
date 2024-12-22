import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FaceDetection from './components/FaceDetection'
import EmbeddingGenerator from './components/EmbeddingGenerator'

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<FaceDetection />} />
          <Route path="/embedding" element={<EmbeddingGenerator />} />
        </Routes>

        <footer className="text-center text-gray-500 text-xs mt-4">
          © 2024 Naco. All rights reserved.
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
