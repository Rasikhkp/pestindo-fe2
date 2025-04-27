import { TechnicianItem } from "@/types/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardFooter, CardContent, CardHeader } from "../ui/card";
import { cn } from "@/lib/utils";

const IMAGE_BASE_URL = import.meta.env.VITE_API_URL + "/storage/";
const PLACEHOLDER_IMAGE = "https://placehold.co/300x200";

const getBadgeColor = (type: string) => {
    switch (type) {
        case "chemical":
            return "bg-blue-100 text-rose-800 hover:bg-blue-100"
        case "asset":
            return "bg-yellow-100 text-emerald-800 hover:bg-yellow-100"
        case "equipment":
            return "bg-red-100 text-amber-800 hover:bg-red-100"
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
}

export const ItemCard = ({ item, className }: { item: TechnicianItem, className?: string }) => {


    return (
        <Card className={cn("overflow-hidden border shadow-sm ", className)}>
            <CardContent className="p-3">
                <img
                    src={`${IMAGE_BASE_URL}/${item.image}`}
                    alt={item.name}
                    className="rounded-md object-cover w-full aspect-[4/3] bg-gray-100"
                />

                <div className="mt-2 font-medium text-gray-600 dark:text-gray-300">{item.name}</div>
                <div className="text-xs text-gray-500">#{item.code}</div>
            </CardContent>

            <CardFooter className="p-3 border-t">
                <div className="flex w-full justify-between">
                    <div>
                        <div className="text-xs mb-1 text-gray-500">Jumlah</div>
                        <div className="text-lg">
                            <Badge variant='outline'>{item.amount}</Badge>
                        </div>
                    </div>
                    <div>

                        <div className="text-xs mb-1 text-gray-500">Tipe</div>
                        <Badge className={getBadgeColor(item.type)}>
                            {item.type}
                        </Badge>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}