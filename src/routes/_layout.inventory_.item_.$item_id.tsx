import { createFileRoute, Navigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { api, canAccess, formatToRupiah, getApiErrorMessage } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const IMAGE_BASE_URL = import.meta.env.VITE_API_URL + "/storage/";
const PLACEHOLDER_IMAGE = "https://placehold.co/300x200";

export const Route = createFileRoute("/_layout/inventory_/item_/$item_id")({
    component: RouteComponent,
    loader: async ({ params }) => {
        try {
            const { data } = await api()
                .get("items/" + params.item_id)
                .json<any>();
            return data;
        } catch (error) {
            const errorMessage = await getApiErrorMessage(error);
            throw new Error(errorMessage.message);
        }
    },
});

function RouteComponent() {
    const { auth } = useAuth();

    if (!canAccess(["Inventory", "Superadmin"], auth?.user.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    const router = useRouter();
    const item = Route.useLoaderData();

    // Helper function to get type badge style
    const getTypeBadge = (type: string) => {
        let badgeStyle = "";
        let typeText = "";

        if (type === "chemical") {
            badgeStyle = "bg-green-100 text-green-800";
            typeText = "Chemical";
        } else if (type === "equipment") {
            badgeStyle = "bg-blue-100 text-blue-800";
            typeText = "Equipment";
        } else if (type === "asset") {
            badgeStyle = "bg-purple-100 text-purple-800";
            typeText = "Asset";
        }

        return <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeStyle}`}>{typeText}</span>;
    };

    return (
        <>
            <button
                onClick={() => router.history.back()}
                className="flex items-center gap-3 mb-8 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
            >
                <ArrowLeft size={16} className="transition-all group-hover:-translate-x-1" /> Kembali
            </button>

            <div className="my-2 text-xl font-medium dark:text-gray-300">Kode Item #{item.code}</div>
            <div className="mt-2 mb-8 text-sm text-gray-700 dark:text-gray-400">Detail Informasi Item</div>

            <div className="flex flex-col gap-4 mb-4 xl:flex-row">
                <div className="text-sm text-gray-600 dark:text-gray-200">
                    <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600">
                        <div className="p-4 text-lg font-semibold">Informasi Item</div>

                        <div className="border-b border-gray-200 dark:border-gray-600"></div>

                        <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-40 font-medium">Nama</div>
                            <div className="flex-1">{item.name}</div>
                        </div>

                        <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-40 font-medium">Tipe</div>
                            <div className="flex-1">{getTypeBadge(item.type)}</div>
                        </div>

                        <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-40 font-medium">Harga</div>
                            <div className="flex-1">{formatToRupiah(item.price)}</div>
                        </div>

                        <div className="flex p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-40 font-medium">Jumlah</div>
                            <div className="flex-1">{item.amount} {item.unit}</div>
                        </div>

                        {item.note && (
                            <div className="flex p-4">
                                <div className="w-40 font-medium">Catatan</div>
                                <div className="flex-1">{item.note}</div>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="flex-1 text-sm text-gray-600 dark:text-gray-200"
                >
                    <div className="w-full border border-gray-200 rounded-xl dark:border-gray-600">
                        <div className="p-4 text-lg font-semibold">Gambar Item</div>

                        <div className="border-b border-gray-200 dark:border-gray-600"></div>

                        <div className="p-4">
                            {item.image ? (
                                <img
                                    src={`${IMAGE_BASE_URL}${item.image}` || PLACEHOLDER_IMAGE}
                                    alt={item.name}
                                    className="object-contain w-full rounded-lg h-72"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full bg-gray-100 rounded-lg h-72 dark:bg-gray-700">
                                    <p className="text-gray-500 dark:text-gray-400">Tidak ada gambar</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RouteComponent; 