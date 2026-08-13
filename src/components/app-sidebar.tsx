'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FlaskConical,
    PieChart,
    LayoutGrid,
    KanbanSquare,
    Repeat,
    PenSquare,
    BookOpen,
    Target,
    Megaphone,
    Users,
    LogOut,
    Radar,
    Settings,
    Bot,
    Trophy,
    BrainCircuit,
    Swords,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { SidebarGamificationWidget } from '@/components/gamification/sidebar-widget';

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const t = useTranslations('nav');
    const supabase = createClient();

    const [isVisible, setIsVisible] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const navItems = [
        { href: '/agent', label: t('agent'), icon: Bot },
        { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/decisions', label: t('decisions'), icon: Swords },
        { href: '/progression', label: t('progression'), icon: Trophy },
        { href: '/hypotheses', label: t('hypotheses'), icon: FlaskConical },
        { href: '/finances', label: t('finances'), icon: PieChart },
        { href: '/lean-canvas', label: t('leanCanvas'), icon: LayoutGrid },
        { href: '/roadmap', label: t('roadmap'), icon: KanbanSquare },
        { href: '/routine', label: t('routine'), icon: Repeat },
        { href: '/competitive-watch', label: t('competitive'), icon: Radar },
        { href: '/memory', label: t('memory'), icon: BrainCircuit },
        { href: '/whiteboard', label: t('whiteboard'), icon: PenSquare },
        { href: '/content', label: t('content'), icon: Megaphone },
        { href: '/go-to-market', label: t('goToMarket'), icon: Target },
        { href: '/crm', label: t('crm'), icon: Users },
        { href: '/journal', label: t('journal'), icon: BookOpen },
    ];

    const showSidebar = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setIsVisible(true);
    }, []);

    const hideSidebar = useCallback(() => {
        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 200);
    }, []);



    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/auth');
    };

    return (
        <>
            {/* Zone de détection invisible côté gauche */}
            <div
                ref={triggerRef}
                className="fixed left-0 top-0 h-full w-[20px] z-[60]"
                onMouseEnter={showSidebar}
            />

            {/* Overlay sombre quand sidebar visible */}
            {isVisible && (
                <div
                    className="fixed inset-0 bg-black/50 z-[59] transition-opacity duration-200"
                    onClick={() => setIsVisible(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={cn(
                    "fixed left-0 top-0 h-full w-[240px] z-[61] flex flex-col",
                    "bg-card border-r border-border shadow-sm",
                    "transition-transform duration-200 ease-out",
                    isVisible ? "translate-x-0" : "-translate-x-full"
                )}
                onMouseEnter={showSidebar}
                onMouseLeave={hideSidebar}
            >
                {/* Logo */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3 px-2">
                        <div className="relative w-8 h-8 shrink-0">
                            <Image
                                alt="Helmdash Logo"
                                                                src="/helmdash-lockup-navy.png"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                            Helmdash
                        </span>
                    </div>
                </div>

                <SidebarGamificationWidget />

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-3 px-2">
                    <div className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsVisible(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <item.icon className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer: Sign Out */}
                <div className="p-3 border-t border-border flex flex-col gap-1">
                    <Link
                        href="/settings"
                        onClick={() => setIsVisible(false)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150",
                            pathname.startsWith('/settings')
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <Settings className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t('settings')}</span>
                    </Link>
                    <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 justify-start px-3 py-2 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {t('signOut')}
                        </span>
                    </Button>
                </div>
            </aside>
        </>
    );
}
