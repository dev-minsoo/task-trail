"use client";

import { useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight, LayoutList, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const navItems = [
  { id: "tasks", label: "Tasks", icon: LayoutList },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 h-screen border-r border-slate-200 bg-white/70 backdrop-blur-xl transition-[width] duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <Card className="flex h-full w-full flex-col rounded-none border-0 bg-transparent shadow-none">
        <div className="px-5 py-4">
          <div className={`flex w-full items-center ${isCollapsed ? "flex-col gap-2" : "gap-3"}`}>
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 p-2 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div
              className={`overflow-hidden whitespace-nowrap transition-opacity duration-150 ${
                isCollapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"
              }`}
            >
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">TaskTrail</h1>
              <p className="text-xs text-slate-400">Focus with clarity.</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-2" />

        <nav className="flex-1 space-y-2 overflow-visible px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                className={`group relative h-11 w-full text-slate-600 hover:bg-slate-50 ${
                  isCollapsed ? "justify-center px-0" : "justify-start gap-3"
                }`}
              >
                <Icon className="h-4 w-4 text-slate-400" />
                <span
                  className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity duration-150 ${
                    isCollapsed
                      ? "max-w-0 opacity-0"
                      : "max-w-[160px] opacity-100"
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 ${
                    isCollapsed ? "block" : "hidden"
                  }`}
                >
                  {item.label}
                </span>
              </Button>
            );
          })}
        </nav>

        <div
          className={`absolute bottom-4 flex w-full ${
            isCollapsed ? "justify-center" : "justify-end pr-4"
          }`}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </aside>
  );
}
