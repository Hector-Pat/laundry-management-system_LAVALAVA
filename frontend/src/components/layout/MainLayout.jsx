import Navbar from './Navbar'
import Sidebar from './Sidebar'

function MainLayout({ children, navLinks = [], userName, userRole, onLogout }) {
  return (
    <div className="flex h-screen overflow-hidden bg-linen text-ink font-sans print:block print:h-auto print:overflow-visible">
      <Sidebar navLinks={navLinks} />

      <div className="flex flex-col flex-1 overflow-hidden print:block">
        <Navbar userName={userName} userRole={userRole} onLogout={onLogout} />

        {/* h-full para que el hijo (RecepcionistaPage) pueda usar flex flex-col h-full */}
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
          <div className="h-full print:h-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
