import React, { useState } from 'react';
import {
  SearchIcon,
  BellIcon,
  PlusIcon,
  SparklesIcon,
  MoonIcon,
  SunIcon,
  MenuIcon,
  ChevronDownIcon,
  BuildingIcon } from
'lucide-react';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { authApi } from '@/features/auth/api/auth.api';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUnreadNotifications,
} from '@/features/notifications/hooks/useNotificationQueries';
const branches: any[] = [{id: '1', name: 'Main Branch'}];

interface HeaderProps {
  onMenuClick: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}
export function Header({ onMenuClick, onToggleTheme, isDark }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const notificationsQuery = useUnreadNotifications();
  const markNotificationRead = useMarkNotificationRead();
  const markAllNotificationsRead = useMarkAllNotificationsRead();
  const [branchOpen, setBranchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(branches[0]);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const unreadCount = notificationsQuery.data?.data?.length || 0;

  const notificationHref = (entityType?: string | null, entityId?: string | null) => {
    if (!entityType || !entityId) return null;
    if (entityType === 'lab_orders') return `/lab/reports?orderId=${entityId}`;
    if (entityType === 'patients') return `/patients/${entityId}`;
    if (entityType === 'visits') return `/visits/${entityId}/consult`;
    return null;
  };

  const handleNotificationClick = async (id: string, entityType?: string | null, entityId?: string | null) => {
    await markNotificationRead.mutateAsync(id);
    setNotificationsOpen(false);
    const target = notificationHref(entityType, entityId);
    if (target) navigate(target);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Clear local auth state even if the backend cookie clear request fails.
    }
    logout();
    navigate('/login');
  };
  return (
    <header className="sticky top-0 z-20 h-14 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-line dark:border-line-dark">
      <div className="h-full flex items-center gap-3 px-4 lg:px-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden -ml-1 p-2 rounded-lg hover:bg-subtle dark:hover:bg-subtle-dark text-ink-secondary">
          
          <MenuIcon className="w-4 h-4" />
        </button>

        {/* Global search */}
        <div className="flex-1 max-w-xl">
          <Input
            icon={<SearchIcon />}
            placeholder="Search patient, P-ID, invoice…"
            iconRight={
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-subtle dark:bg-subtle-dark rounded border border-line dark:border-line-dark text-ink-tertiary">
                ⌘K
              </kbd>
            } />
          
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1">
          {/* Branch selector */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setBranchOpen((o) => !o)}
              className="h-9 px-3 inline-flex items-center gap-2 rounded-lg text-xs font-medium text-ink-secondary hover:bg-subtle dark:hover:bg-subtle-dark">
              
              <BuildingIcon className="w-3.5 h-3.5" />
              <span className="max-w-[140px] truncate">
                {currentBranch.name}
              </span>
              <ChevronDownIcon className="w-3 h-3" />
            </button>
            {branchOpen &&
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark shadow-pop py-1.5 z-50">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-ink-tertiary tracking-wider">
                  Switch branch
                </div>
                {branches.map((b) =>
              <button
                key={b.id}
                onClick={() => {
                  setCurrentBranch(b);
                  setBranchOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-sm hover:bg-subtle dark:hover:bg-subtle-dark flex items-center justify-between',
                  b.id === currentBranch.id && 'text-accent font-medium'
                )}>
                
                    <span>{b.name}</span>
                    {b.id === currentBranch.id &&
                <span className="text-xs">●</span>
                }
                  </button>
              )}
              </div>
            }
          </div>

          {/* Date/Time */}
          <div className="hidden lg:flex flex-col text-right px-2 leading-tight">
            <span className="text-[11px] text-ink-secondary">{dateStr}</span>
            <span className="text-[11px] font-mono text-ink-tertiary">
              {timeStr}
            </span>
          </div>

          <IconButton
            variant="ghost"
            aria-label="Quick add"
            className="hidden sm:inline-flex">
            
            <PlusIcon />
          </IconButton>

          <IconButton
            variant="ghost"
            aria-label="AI assistant"
            className="hidden sm:inline-flex text-accent">
            
            <SparklesIcon />
          </IconButton>

          <IconButton
            variant="ghost"
            aria-label="Notifications"
            className="relative"
            onClick={() => setNotificationsOpen((open) => !open)}>
            <BellIcon />
            {unreadCount > 0 &&
            <>
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] leading-4 text-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            }
          </IconButton>
          {notificationsOpen &&
          <div className="absolute right-4 top-14 md:right-6 lg:right-8 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark shadow-pop z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-line dark:border-line-dark">
                <div>
                  <p className="text-sm font-semibold text-ink-primary dark:text-ink-primary-dark">Notifications</p>
                  <p className="text-xs text-ink-tertiary">{unreadCount} unread</p>
                </div>
                <button
                  onClick={() => markAllNotificationsRead.mutate()}
                  disabled={unreadCount === 0 || markAllNotificationsRead.isPending}
                  className="text-xs font-medium text-accent disabled:text-ink-tertiary">
                  {markAllNotificationsRead.isPending ? 'Marking...' : 'Mark all read'}
                </button>
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {notificationsQuery.isLoading ? (
                  <div className="p-4 text-sm text-ink-secondary">Loading notifications...</div>
                ) : unreadCount === 0 ? (
                  <div className="p-4 text-sm text-ink-secondary">No unread notifications right now.</div>
                ) : (
                  notificationsQuery.data?.data?.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id, notification.entityType, notification.entityId)}
                      className="w-full px-4 py-3 text-left border-b border-line/60 dark:border-line-dark/60 last:border-b-0 hover:bg-subtle/50 dark:hover:bg-subtle-dark/50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-ink-primary dark:text-ink-primary-dark">{notification.title}</p>
                          <p className="text-xs text-ink-secondary mt-1">{notification.message}</p>
                          <p className="text-[11px] text-ink-tertiary mt-2">
                            {new Date(notification.createdAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <span className="mt-1 inline-block w-2 h-2 rounded-full bg-accent shrink-0" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          }

          <IconButton
            variant="ghost"
            onClick={onToggleTheme}
            aria-label="Toggle theme">
            
            {isDark ? <SunIcon /> : <MoonIcon />}
          </IconButton>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 pl-1.5 pr-2 h-9 rounded-lg hover:bg-subtle dark:hover:bg-subtle-dark">
              
              <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-semibold uppercase">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-xs font-medium text-ink-primary dark:text-ink-primary-dark">
                  {user?.name?.split(' ').slice(0, 2).join(' ') || 'User'}
                </span>
                <span className="text-[10px] text-ink-tertiary">
                  {user?.role || 'Staff'}
                </span>
              </div>
              <ChevronDownIcon className="w-3 h-3 text-ink-tertiary hidden md:block" />
            </button>
            {profileOpen &&
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark shadow-pop py-1.5 z-50">
                <div className="px-3 py-2 border-b border-line dark:border-line-dark">
                  <p className="text-sm font-medium text-ink-primary dark:text-ink-primary-dark">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-ink-tertiary truncate">
                    {user?.email || 'user@hospeon.com'}
                  </p>
                </div>
                {[
              { label: 'Profile', onClick: () => {} },
              { label: 'Preferences', onClick: () => {} },
              { label: 'My audit log', onClick: () => {} },
              { label: 'Help & docs', onClick: () => {} },
              { label: 'Sign out', onClick: handleLogout }].
              map((item) =>
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full px-3 py-1.5 text-left text-sm text-ink-secondary hover:bg-subtle dark:hover:bg-subtle-dark hover:text-ink-primary">
                
                    {item.label}
                  </button>
              )}
              </div>
            }
          </div>
        </div>
      </div>
    </header>);

}
