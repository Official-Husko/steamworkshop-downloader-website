import { render } from 'preact'
import '../index.css'
import '../styles/layout.css'
import { AdminApp } from './AdminApp'

render(<AdminApp />, document.getElementById('app')!)
