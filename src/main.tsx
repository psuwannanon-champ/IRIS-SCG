import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import './index.css'
import { router } from '@/app/router'
import { DataProvider } from '@/app/data'
import { Toaster } from '@/components/ui'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <RouterProvider router={router} />
      <Toaster />
    </DataProvider>
  </StrictMode>,
)
