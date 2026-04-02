import InventoryView from "@/components/inventory-view"
import inventoryData from "@/public/data/inventory.json"

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panda Express #{inventoryData.meta.store}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {inventoryData.meta.report} · {inventoryData.meta.weeks[0]}–{inventoryData.meta.weeks[inventoryData.meta.weeks.length - 1]}
        </p>
      </div>
      <InventoryView inventory={inventoryData} />
    </div>
  )
}
