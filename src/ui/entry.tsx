import { createRoot } from 'react-dom/client'
import NavigationInspectorPanel from './panel'

const root = createRoot(document.getElementById('root')!)
root.render(<NavigationInspectorPanel />)
