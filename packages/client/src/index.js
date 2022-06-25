import React, { useContext } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'

import './index.css'
import App from './App'
import { ColorThemeProvider, ColorThemeContext } from './components/colortheme'

import '@fontsource/inter'

TimeAgo.addDefaultLocale(en)

const ThemedToastContainer = ({ children, ...props }) => {
  const theme = useContext(ColorThemeContext)
  return (
    <ToastContainer theme={theme} {...props}>
      {children}
    </ToastContainer>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <ColorThemeProvider>
    <BrowserRouter>
      <App />
      <ThemedToastContainer />
    </BrowserRouter>
  </ColorThemeProvider>
)
