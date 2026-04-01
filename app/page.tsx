import inventoryData from "@/public/data/inventory.json";
import InventoryView from "@/components/inventory-view";

export default function Home() {
  return <InventoryView data={inventoryData} />;
}
