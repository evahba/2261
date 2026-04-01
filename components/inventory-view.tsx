"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import caseUnitsRaw from "@/public/data/case_units.json";

const caseUnits = caseUnitsRaw as unknown as Record<string, number>;

interface Product {
  product_number: string;
  name: string;
  unit: string;
  category: string;
  w10: number | null;
  w11: number | null;
  w12: number | null;
  w13: number | null;
  average: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  "Meat": "Meat",
  "Seafood": "Seafood",
  "Produce": "Produce",
  "Grocery": "Grocery",
  "Beverages": "Beverages",
  "Paper": "Paper",
  "Condiments": "Condiments",
  "Other Cogs": "Other",
};

const DISPLAY_ORDER = ["Meat", "Seafood", "Produce", "Grocery", "Beverages", "Paper", "Condiments", "Other Cogs"];

function fmt(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined) return "—";
  return val.toFixed(decimals);
}

function ProductCard({ product, target }: { product: Product; target: number }) {
  const multiplier = target / 1000;
  const needed = product.average !== null ? product.average * multiplier : null;
  const caseSize = caseUnits[product.product_number] ?? null;
  const neededCases = needed !== null && caseSize !== null ? needed / caseSize : null;

  return (
    <Card className="shadow-none border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{product.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{product.product_number}</p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">{product.unit}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-xl font-bold tabular-nums">{fmt(product.average)}</p>
            <p className="text-xs text-muted-foreground">{product.unit}/$1k</p>
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{fmt(needed)}</p>
            <p className="text-xs text-muted-foreground">
              {product.unit} @ ${target.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">
              {neededCases !== null ? neededCases.toFixed(2) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {caseSize !== null ? `cases (${caseSize}/${product.unit})` : "no case size"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 text-center">
          {[product.w10, product.w11, product.w12, product.w13].map((val, i) => (
            <div key={i} className="bg-muted/50 rounded p-1">
              <p className="text-xs font-medium tabular-nums">{fmt(val)}</p>
              <p className="text-[10px] text-muted-foreground">W{10 + i}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function InventoryView({ data }: { data: Product[] }) {
  const [target, setTarget] = useState(1000);
  const [search, setSearch] = useState("");

  const categories = useMemo(() => {
    return DISPLAY_ORDER.filter(cat => data.some(p => p.category === cat));
  }, [data]);

  const grouped = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const cat of categories) {
      map[cat] = data
        .filter(p => p.category === cat)
        .sort((a, b) => {
          const aCases = a.average !== null && caseUnits[a.product_number] ? a.average / caseUnits[a.product_number] : 0;
          const bCases = b.average !== null && caseUnits[b.product_number] ? b.average / caseUnits[b.product_number] : 0;
          return bCases - aCases;
        });
    }
    return map;
  }, [data, categories]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return data
      .filter(p => p.name.toLowerCase().includes(q) || p.product_number.toLowerCase().includes(q))
      .sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
  }, [data, search]);

  const defaultTab = categories[0] ?? "Meat";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panda Express #2261</h1>
        <p className="text-sm text-muted-foreground mt-1">Consumption per $1,000 of sales · W10–W13 2026</p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium">$</span>
          <Input
            type="number"
            className="w-28"
            min={0}
            step={500}
            value={target}
            onChange={e => setTarget(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      {searchResults ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
          </p>
          {searchResults.map(p => (
            <ProductCard key={p.product_number} product={p} target={target} />
          ))}
        </div>
      ) : (
        <Tabs defaultValue={defaultTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
            {categories.map(cat => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="rounded-full border text-xs px-3 py-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                {CATEGORY_LABELS[cat] ?? cat}
                <span className="ml-1.5 text-[10px] opacity-60">{grouped[cat]?.length}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat} value={cat} className="space-y-3 mt-0">
              {grouped[cat]?.map(p => (
                <ProductCard key={p.product_number} product={p} target={target} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <footer className="text-center text-xs text-muted-foreground pt-2 pb-4">
        Store #2261 · Fiscal Weeks W10–W13 2026
      </footer>
    </div>
  );
}
