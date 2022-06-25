import { createContext } from 'react'
import useMatchMedia from 'react-simple-matchmedia'

export const ColorThemeContext = createContext()

export const ColorThemeProvider = ({ children, ...props }) => {
  const match = useMatchMedia('(prefers-color-scheme: dark)')

  return (
    <ColorThemeContext.Provider value={match ? 'dark' : 'light'} {...props}>
      {children}
    </ColorThemeContext.Provider>
  )
}
