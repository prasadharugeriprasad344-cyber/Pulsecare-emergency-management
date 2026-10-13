import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Clock,
  Sparkles,
  ChevronRight,
  User,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import { NAV_ITEMS } from './Sidebar';
import { ActivityEvent } from '../types';

interface TopNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  setMobileOpen: (open: boolean) => void;
  activities: ActivityEvent[];
  onSearchOpen: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  setCurrentTab,
  setMobileOpen,
  activities,
  onSearchOpen,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentNav = NAV_ITEMS.find((item) => item.id === currentTab);

  return (
    <header className="h-16 bg-surface border-b border-border sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between shadow-subtle">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-background hover:text-navy"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-text-secondary hover:text-navy cursor-pointer" onClick={() => setCurrentTab('overview')}>
            PulseCare
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
          <span className="font-semibold text-navy">{currentNav?.label || 'Overview'}</span>
        </nav>
      </div>

      {/* Center / Search bar trigger */}
      <div className="hidden md:flex items-center">
        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border text-xs text-text-secondary hover:text-navy hover:border-teal-medical transition-all w-64 shadow-subtle"
        >
          <Search className="w-3.5 h-3.5 text-text-muted" />
          <span>Quick patient or command search...</span>
          <kbd className="ml-auto px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-text-muted">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Clock, Mode, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Live Clock Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border text-xs font-medium text-navy">
          <Clock className="w-3.5 h-3.5 text-teal-medical" />
          <span>{timeStr || '12:00:00'}</span>
        </div>

        {/* Simulation Mode Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-soft border border-teal-medical/20 text-xs font-semibold text-teal-dark">
          <span className="w-2 h-2 rounded-full bg-teal-medical animate-ping" />
          <span>Simulation Active</span>
        </div>

        {/* Notifications Popover Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-text-secondary hover:bg-background hover:text-navy relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {activities.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-priority-critical" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface rounded-2xl shadow-floating border border-border p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-navy">
                  Recent ER Activity
                </span>
                <span className="text-[10px] font-medium text-text-secondary">
                  {activities.length} events
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="p-2 rounded-xl bg-background border border-border/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-navy">{act.title}</span>
                      <span className="text-[10px] text-text-muted">{act.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-0.5">{act.description}</p>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-4 text-xs text-text-secondary">
                    No activity recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Launch Simulator Button */}
        <button
          onClick={() => setCurrentTab('simulator')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-medium hover:bg-navy-light transition-colors shadow-subtle"
        >
          <Play className="w-3.5 h-3.5 text-teal-medical fill-teal-medical" />
          <span>Run Simulator</span>
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-teal-soft border border-teal-medical/40 flex items-center justify-center text-teal-dark font-bold text-xs">
            OS
          </div>
        </div>
      </div>
    </header>
  );
};
