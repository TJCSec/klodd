import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'

import './index.css'
import App from './App'

TimeAgo.addDefaultLocale(en)

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <BrowserRouter>
    <App />
    <ToastContainer />
  </BrowserRouter>
)
