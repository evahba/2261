"use client"

import { useState, useMemo } from "react"
import caseUnitsRaw from "@/public/data/case_units.json"

const caseUnits = caseUnitsRaw as unknown as Record<string, number>

type Product = {
  product_number: string
  product: string
  unit: string
  weeks: Record<string, number | null>
  average: number | null
}

type InventoryData = {
  meta: {
    store: string
    weeks: string[]
    report: string
    source_file: string
  }
  data: Record<string, Product[]>
}

const CHICKEN_PNS = new Set(["P10002","P10008","P10018","P10019","P10027","P10028"])
const BEEF_PNS = new Set(["P5007","P5017","P5020"])
const APPETIZER_PNS = new Set(["P1260","P1001","P1004"])
const SAUCE_PNS = new Set(["P2169","P1249","P1404","P1295","P1580","P1233","P1268","P1116","P1124","P1151","P1566","P1652","P23001","P1107","P1093","P1261","P1272","P1158","P19052"])
const CUPS_ONLY_PNS = new Set(["P35268","P35040","P35149","P35269","P35380"])
const LIDS_ONLY_PNS = new Set(["P35067","P35062","P35065","P35406"])
const CUPS_PNS = new Set([...CUPS_ONLY_PNS, ...LIDS_ONLY_PNS])
const A_LA_CARTE_PNS = ["P35130","P35126","P35081"]
const BOWLS_LIDS_PNS = ["P35508","P35509"]
const PACKAGING_PNS = new Set(["P35522","P36029","P35659","P35660","P35508","P35130","P35126","P35081","P35634","P35509","P35444","P35542","P35048","P35213","P35078","P35432","P35580","P35477","P35135","P35275","P35189","P35094"])
const DRINKS_PNS = new Set(["P25003","P25004","P25027","P25006","P25005","P25933","P25346","P25943","P25077","P25244","P25341","P25343"])

const CATEGORY_ORDER = ["Meats","Produce","Appetizers","Sauces","Cups & Lids","Packaging","Drinks","Grocery"]

function fmtNum(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return "—"
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

function buildCategories(inventory: InventoryData): Record<string, Product[]> {
  const allItems: Record<string, Product> = {}
  for (const items of Object.values(inventory.data)) {
    for (const item of items) allItems[item.product_number] = item
  }

  const seafoodPNs = new Set((inventory.data["Seafood"] ?? []).map(i => i.product_number))
  const producePNs = new Set((inventory.data["Produce"] ?? []).map(i => i.product_number))
  const assigned = new Set([...CHICKEN_PNS, ...BEEF_PNS, ...seafoodPNs, ...producePNs, ...APPETIZER_PNS, ...SAUCE_PNS, ...CUPS_PNS, ...PACKAGING_PNS, ...DRINKS_PNS])

  const groceryPNs = Object.values(inventory.data).flat()
    .map(i => i.product_number)
    .filter(pn => !assigned.has(pn))

  const sortByCases = (items: Product[]) =>
    [...items].sort((a, b) => {
      const aCases = a.average != null ? a.average / (caseUnits[a.product_number] || 1) : 0
      const bCases = b.average != null ? b.average / (caseUnits[b.product_number] || 1) : 0
      return bCases - aCases
    })

  const pick = (pns: Set<string>) => sortByCases(
    [...pns].map(pn => allItems[pn]).filter(Boolean)
  )

  return {
    Meats: [
      ...pick(CHICKEN_PNS),
      ...pick(BEEF_PNS),
      ...sortByCases(inventory.data["Seafood"] ?? []),
    ],
    Produce: sortByCases(inventory.data["Produce"] ?? []),
    Appetizers: pick(APPETIZER_PNS),
    Sauces: pick(SAUCE_PNS),
    "Cups & Lids": [...pick(CUPS_ONLY_PNS), ...pick(LIDS_ONLY_PNS)],
    Packaging: [
      ...A_LA_CARTE_PNS.map(pn => allItems[pn]).filter(Boolean),
      ...BOWLS_LIDS_PNS.map(pn => allItems[pn]).filter(Boolean),
      ...sortByCases([...PACKAGING_PNS].filter(pn => !A_LA_CARTE_PNS.includes(pn) && !BOWLS_LIDS_PNS.includes(pn)).map(pn => allItems[pn]).filter(Boolean)),
    ],
    Drinks: pick(DRINKS_PNS),
    Grocery: sortByCases(groceryPNs.map(pn => allItems[pn]).filter(Boolean)),
  }
}

export default function InventoryView({ inventory }: { inventory: InventoryData }) {
  const [salesTarget, setSalesTarget] = useState(1000)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("")

  const multiplier = salesTarget / 1000
  const weeks = inventory.meta.weeks

  const grouped = useMemo(() => buildCategories(inventory), [inventory])
  const categories = useMemo(() => {
    return CATEGORY_ORDER.filter((cat) => (grouped[cat]?.length ?? 0) > 0)
  }, [grouped])

  const active = activeCategory || categories[0] || ""
  const trimmedSearch = search.trim().toLowerCase()

  const searchResults = useMemo(() => {
    if (!trimmedSearch) return null
    const results: Array<{ category: string; product: Product }> = []
    for (const cat of CATEGORY_ORDER) {
      for (const product of grouped[cat] ?? []) {
        if (
          product.product.toLowerCase().includes(trimmedSearch) ||
          product.product_number.toLowerCase().includes(trimmedSearch)
        ) {
          results.push({ category: cat, product })
        }
      }
    }
    return results
  }, [grouped, trimmedSearch])

  const products = useMemo(() => grouped[active] ?? [], [grouped, active])

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Sales Target
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adjust to scale usage amounts — data is per $1,000 in net sales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">$</span>
          <input
            type="number"
            min={0}
            step={100}
            value={salesTarget}
            onChange={(e) => setSalesTarget(Number(e.target.value) || 0)}
            className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-sm text-muted-foreground font-medium">
            ×{fmtNum(multiplier, 2)}
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products across all categories…"
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {searchResults ? (
        searchResults.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No products found for &ldquo;{search}&rdquo;
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {searchResults.length} result
              {searchResults.length !== 1 ? "s" : ""} across all categories
            </p>

            <div className="flex flex-col gap-2 lg:hidden">
              {searchResults.map(({ category, product }) => {
                const caseSize = caseUnits[product.product_number]
                const neededUnits =
                  product.average != null ? product.average * multiplier : null
                const neededCases =
                  caseSize && neededUnits != null
                    ? neededUnits / caseSize
                    : undefined
                return (
                  <div
                    key={product.product_number}
                    className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-muted-foreground bg-secondary rounded px-1.5 py-0.5">
                            {category}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {product.product}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {product.product_number}
                        </p>
                      </div>
                      {neededCases !== undefined ? (
                        <div className="shrink-0 text-right">
                          <p className="text-3xl font-bold tabular-nums text-primary leading-none">
                            {fmtNum(neededCases)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            cases{" "}
                            <span className="opacity-60">
                              / {caseSize} {product.unit}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <span className="shrink-0 text-xs font-medium text-muted-foreground bg-secondary rounded-md px-2 py-0.5">
                          {product.unit}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>
                        <span className="text-muted-foreground">Avg / $1K</span>
                        <p className="text-foreground font-medium tabular-nums">
                          {fmtNum(product.average)} {product.unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Needed @ ${salesTarget.toLocaleString()}
                        </span>
                        <p className="text-foreground font-semibold tabular-nums">
                          {neededUnits != null
                            ? `${fmtNum(neededUnits)} ${product.unit}`
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap pt-1 border-t border-border/40">
                      {weeks.map((w) => (
                        <div key={w} className="text-xs">
                          <span className="text-muted-foreground">{w}: </span>
                          <span className="tabular-nums text-foreground/80">
                            {product.weeks[w] != null
                              ? fmtNum(product.weeks[w])
                              : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="hidden lg:block rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        Category
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        Product
                      </th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Unit
                      </th>
                      {weeks.map((w) => (
                        <th
                          key={w}
                          className="text-right px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                        >
                          {w}
                        </th>
                      ))}
                      <th className="text-right px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        Avg / $1K
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        Needed @ ${salesTarget.toLocaleString()}
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        Cases
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map(({ category, product }) => {
                      const caseSize = caseUnits[product.product_number]
                      const neededUnits =
                        product.average != null
                          ? product.average * multiplier
                          : null
                      const neededCases =
                        caseSize && neededUnits != null
                          ? neededUnits / caseSize
                          : undefined
                      return (
                        <tr
                          key={product.product_number}
                          className="border-b border-border/40 hover:bg-accent/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-muted-foreground bg-secondary rounded px-1.5 py-0.5 whitespace-nowrap">
                              {category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">
                              {product.product}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.product_number}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {product.unit}
                          </td>
                          {weeks.map((w) => (
                            <td
                              key={w}
                              className="px-3 py-3 text-right tabular-nums text-foreground/75"
                            >
                              {product.weeks[w] != null
                                ? fmtNum(product.weeks[w])
                                : "—"}
                            </td>
                          ))}
                          <td className="px-3 py-3 text-right tabular-nums text-foreground/80 font-medium">
                            {fmtNum(product.average)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">
                            {fmtNum(neededUnits)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {neededCases !== undefined ? (
                              <span className="font-semibold text-primary">
                                {fmtNum(neededCases)}
                                <span className="text-xs text-muted-foreground font-normal ml-1">
                                  /{caseSize}
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      ) : (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {cat}
                <span className="ml-1.5 text-xs opacity-60">
                  {grouped[cat]?.length ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 lg:hidden">
            {products.map((product) => {
              const caseSize = caseUnits[product.product_number]
              const neededUnits =
                product.average != null ? product.average * multiplier : null
              const neededCases =
                caseSize && neededUnits != null
                  ? neededUnits / caseSize
                  : undefined
              return (
                <div
                  key={product.product_number}
                  className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {product.product}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.product_number}
                      </p>
                    </div>
                    {neededCases !== undefined ? (
                      <div className="shrink-0 text-right">
                        <p className="text-3xl font-bold tabular-nums text-primary leading-none">
                          {fmtNum(neededCases)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          cases{" "}
                          <span className="opacity-60">
                            / {caseSize} {product.unit}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <span className="shrink-0 text-xs font-medium text-muted-foreground bg-secondary rounded-md px-2 py-0.5">
                        {product.unit}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-muted-foreground">Avg / $1K</span>
                      <p className="text-foreground font-medium tabular-nums">
                        {fmtNum(product.average)} {product.unit}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Needed @ ${salesTarget.toLocaleString()}
                      </span>
                      <p className="text-foreground font-semibold tabular-nums">
                        {neededUnits != null
                          ? `${fmtNum(neededUnits)} ${product.unit}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap pt-1 border-t border-border/40">
                    {weeks.map((w) => (
                      <div key={w} className="text-xs">
                        <span className="text-muted-foreground">{w}: </span>
                        <span className="tabular-nums text-foreground/80">
                          {product.weeks[w] != null
                            ? fmtNum(product.weeks[w])
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden lg:block rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      Product
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Unit
                    </th>
                    {weeks.map((w) => (
                      <th
                        key={w}
                        className="text-right px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                      >
                        {w}
                      </th>
                    ))}
                    <th className="text-right px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      Avg / $1K
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      Needed @ ${salesTarget.toLocaleString()}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      Cases
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const caseSize = caseUnits[product.product_number]
                    const neededUnits =
                      product.average != null
                        ? product.average * multiplier
                        : null
                    const neededCases =
                      caseSize && neededUnits != null
                        ? neededUnits / caseSize
                        : undefined
                    return (
                      <tr
                        key={product.product_number}
                        className="border-b border-border/40 hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {product.product}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.product_number}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {product.unit}
                        </td>
                        {weeks.map((w) => (
                          <td
                            key={w}
                            className="px-3 py-3 text-right tabular-nums text-foreground/75"
                          >
                            {product.weeks[w] != null
                              ? fmtNum(product.weeks[w])
                              : "—"}
                          </td>
                        ))}
                        <td className="px-3 py-3 text-right tabular-nums text-foreground/80 font-medium">
                          {fmtNum(product.average)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">
                          {fmtNum(neededUnits)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {neededCases !== undefined ? (
                            <span className="font-semibold text-primary">
                              {fmtNum(neededCases)}
                              <span className="text-xs text-muted-foreground font-normal ml-1">
                                /{caseSize}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Source: {inventory.meta.source_file} · Store #{inventory.meta.store}
      </p>
    </div>
  )
}
