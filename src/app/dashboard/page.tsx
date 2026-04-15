import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b">
        <div className="flex h-16 items-center px-6">
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">Devstash</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  placeholder="Search..."
                  className="w-64"
                />
              </div>
              <Button>
                New Item
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card">
          <div className="p-6">
            <h2 className="text-lg font-semibold">Sidebar</h2>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <h2 className="text-lg font-semibold">Main</h2>
        </main>
      </div>
    </div>
  )
}