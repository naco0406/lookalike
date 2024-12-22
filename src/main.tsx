// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'

import { Analytics } from "@vercel/analytics/react"

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <ChakraProvider value={defaultSystem}>
      <App />
      <Analytics />
    </ChakraProvider>
  // </StrictMode>
)
