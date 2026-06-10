import MedAuthWizard from './components/medauth/MedAuthWizard.jsx'
import SitePasswordGate from './components/SitePasswordGate.jsx'

export default function App() {
  return (
    <SitePasswordGate>
      <MedAuthWizard />
    </SitePasswordGate>
  )
}
