import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Mic, LayoutDashboard, Mic2, TrendingUp, FileText, BookOpen, Library, User, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'MAIN' },
    { to: '/studio', icon: Mic2, label: 'Interview Studio', section: 'MAIN' },
    { to: '/analytics', icon: TrendingUp, label: 'Growth Analytics', section: 'MAIN' },
    { to: '/reports', icon: FileText, label: 'Reports', section: 'MAIN' },
    { to: '/pronunciation', icon: Mic, label: 'Pronunciation Lab', section: 'MAIN' },
    { to: '/library', icon: Library, label: 'Question Library', section: 'MAIN' },
    { to: '/profile', icon: User, label: 'Profile', section: 'ACCOUNT' },
    { to: '/settings', icon: Settings, label: 'Settings', section: 'ACCOUNT' },
  ]

  const sections = ['MAIN', 'ACCOUNT'] as const

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 80 : 260,
        transition: 'width 0.3s ease',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div className="glass-card-static" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 12px',
          borderRadius: 20,
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 8px', marginBottom: 28,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #FF5E78, #E8B4A0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(255,94,120,0.3)',
            }}>
              <Mic size={20} color="white" />
            </div>
            {!collapsed && (
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>SereneAI</span>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sections.map((section) => (
              <div key={section}>
                {!collapsed && (
                  <div style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
                    color: 'var(--color-text-muted)', padding: '12px 12px 6px',
                  }}>
                    {section}
                  </div>
                )}
                {navItems.filter((item) => item.section === section).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 12px', borderRadius: 12,
                      textDecoration: 'none',
                      transition: 'all 0.25s ease',
                      borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                      background: isActive ? 'rgba(255,94,120,0.08)' : 'transparent',
                      boxShadow: isActive ? '0 2px 8px rgba(255,94,120,0.1)' : 'none',
                      marginBottom: 2,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={19}
                          color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                          style={{ flexShrink: 0 }}
                        />
                        {!collapsed && (
                          <span style={{
                            fontSize: 14, fontWeight: isActive ? 600 : 500,
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                          }}>
                            {item.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 12px', borderRadius: 12,
              border: 'none', background: 'transparent',
              cursor: 'pointer', transition: 'all 0.25s ease',
              marginTop: 8,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,94,120,0.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={19} color="var(--color-text-muted)" />
            {!collapsed && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)' }}>Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', top: 40, right: -14,
            width: 28, height: 28, borderRadius: '50%',
            background: 'white', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 10,
          }}
        >
          {collapsed ? <ChevronRight size={16} color="var(--color-primary)" /> : <ChevronLeft size={16} color="var(--color-primary)" />}
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', minHeight: '100vh' }}>
        {/* Top bar with user info */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          gap: 12, marginBottom: 8,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 16px', borderRadius: 100,
            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF5E78, #E8B4A0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 13, fontWeight: 600,
            }}>
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {profile?.full_name || 'User'}
            </span>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  )
}
