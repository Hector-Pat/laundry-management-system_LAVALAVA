import Navbar from './Navbar'
import Sidebar from './Sidebar'

function MainLayout({ children, navLinks = [], userName, userRole, onLogout }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar navLinks={navLinks} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar userName={userName} userRole={userRole} onLogout={onLogout} />

        {/* h-full para que el hijo (RecepcionistaPage) pueda usar flex flex-col h-full */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
