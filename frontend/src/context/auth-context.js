import { createContext } from 'react'

// En su propio archivo (sin componentes) para que Fast Refresh no se queje
// de mezclar un context con un componente en el mismo modulo.
export const AuthContext = createContext(null)
