import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFounderStore } from "@/store/founder-store";
import { calculateStrategyCompleteness } from "@/modules/gtm";
import { Target, Users, Crosshair, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function GtmWidget() {
    const { goToMarket } = useFounderStore();
    const completeness = calculateStrategyCompleteness(goToMarket);
    
    // Default values if not yet configured
    const persona = goToMarket.ompTarget || "Founders, Solopreneurs, Devs";
    const positioning = goToMarket.sbHero || "L'outil de lancement qui s'occupe de votre produit, mais aussi de votre moral.";
    
    return (
        <Card className="flex flex-col h-full bg-card/50 backdrop-blur border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)] relative overflow-hidden group">
            {/* Subtle retro pixel effect overlay */}
            <div className="absolute inset-0 bg-[url('/pixel-overlay.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
            
            <CardHeader className="pb-2 border-b border-border/50 relative z-10">
                <CardTitle className="text-sm font-medium flex items-center justify-between font-pixel tracking-wide text-primary">
                    <span className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        GO-TO-MARKET STRATEGY
                    </span>
                    <Badge variant="outline" className="text-[9px] font-mono">
                        {completeness.score}%
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col gap-4 relative z-10">
                
                {/* Target Market */}
                <div className="space-y-1 bg-background/50 p-3 rounded-md border border-border/50">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1 font-pixel mb-1">
                        <Users className="w-3 h-3" /> Cible & ICP
                    </div>
                    <div className="text-sm font-medium">{persona}</div>
                </div>
                
                {/* Messaging Hook */}
                <div className="space-y-1 bg-background/50 p-3 rounded-md border border-border/50">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1 font-pixel mb-1">
                        <Crosshair className="w-3 h-3" /> The Hook (Message)
                    </div>
                    <div className="text-sm font-medium leading-relaxed text-muted-foreground italic">
                        "{positioning}"
                    </div>
                </div>

                <div className="mt-auto pt-2">
                    <Button variant="default" size="sm" className="w-full text-xs h-9 font-pixel tracking-wide bg-primary/90 hover:bg-primary">
                        <Megaphone className="w-3 h-3 mr-2" />
                        BUILD IN PUBLIC (SHARE)
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
