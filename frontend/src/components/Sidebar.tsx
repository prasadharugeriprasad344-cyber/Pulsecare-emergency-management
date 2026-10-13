import React from 'react';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  PlayCircle,
  BarChart3,
  Hourglass,
  History,
  Info,
  Activity,
  Database,
  ChevronLeft,
  ChevronRight,
  HardDrive
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isBackendConnected: boolean;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'registration', label: 'Patient Registration', icon: UserPlus },
  { id: 'queue', label: 'Patient Queue', icon: Users },
  { id: 'simulator', label: 'Scheduling Simulator', icon: PlayCircle },
  { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
  { id: 'starvation', label: 'Starvation & Aging', icon: Hourglass },
  { id: 'history', label: 'Simulation History', icon: History },
  { id: 'about', label: 'Settings & About', icon: Info },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isBackendConnected,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-surface border-r border-border transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => setCurrentTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shrink-0 shadow-subtle">
              <Activity className="w-5 h-5 text-teal-medical" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-heading font-bold text-base text-navy leading-tight tracking-tight">
                  PulseCare
                </span>
                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
                  Emergency Ops
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-text-secondary hover:text-navy hover:bg-background transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group
                  ${isActive
                    ? 'bg-navy text-white shadow-subtle'
                    : 'text-text-secondary hover:text-text-primary hover:bg-[#F8FAFC]'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-105
                    ${isActive ? 'text-teal-medical' : 'text-text-secondary group-hover:text-navy'}
                  `}
                />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!collapsed && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-medical shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Persistence Status Badge Footer */}
        <div className="p-3 border-t border-border">
          <div
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background border border-border text-xs
              ${collapsed ? 'justify-center px-0' : ''}
            `}
          >
            {isBackendConnected ? (
              <Database className="w-3.5 h-3.5 text-teal-medical shrink-0" />
            ) : (
              <HardDrive className="w-3.5 h-3.5 text-priority-high shrink-0" />
            )}
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-text-primary truncate">
                  {isBackendConnected ? 'FastAPI + SQLite' : 'Browser Storage'}
                </span>
                <span className="text-[10px] text-text-secondary truncate">
                  {isBackendConnected ? 'Active REST Backend' : 'Offline Mode'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
