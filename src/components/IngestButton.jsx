import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'

// Complaints arrive FROM the NCRP portal (via API) rather than being filed in-app.
// This trigger simulates the next inbound complaint hitting the pipeline.
export default function IngestButton({
  children = 'Ingest next NCRP complaint',
  className = 'btn primary',
  goTo = 'case',
  style,
}) {
  const app = useApp()
  const nav = useNavigate()

  function run() {
    const id = app.ingestComplaint()
    if (goTo === 'case' && id) nav(`/cases/${id}`)
  }

  return (
    <button className={className} onClick={run} style={style}>
      {children}
    </button>
  )
}
