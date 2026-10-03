import React from 'react'
import Home from './pages/home/Home'
import { Routes, Route } from 'react-router-dom'
import Player from './pages/Player/Player'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const App = () => {
  return (
    <div>
      <ToastContainer theme='dark' />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/player/:id' element={<Player />} />
        <Route path='/Player/:id' element={<Player />} />
        <Route path='*' element={<Home />} />
      </Routes>
    </div>
  )
}

export default App


