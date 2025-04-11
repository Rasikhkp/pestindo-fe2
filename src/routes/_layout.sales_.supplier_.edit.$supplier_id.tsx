import { createFileRoute, Navigate, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { errorAtom } from "@/store/error";
import { api, canAccess, getApiErrorMessage } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SupplierForm, SupplierFormType } from "@/components/supplier/SupplierForm";

export const Route = createFileRoute("/_layout/sales_/supplier_/edit/$supplier_id")({
    component: RouteComponent,
    loader: async ({ params }) => {
        try {
            const { data } = await api().get("suppliers/" + params.supplier_id).json<any>();
            return {
                name: data.name,
                phone: data.phone,
                address: data.address,
            };
        } catch (error) {
            const errorMessage = await getApiErrorMessage(error);
            throw new Error(errorMessage.message);
        }
    },
    shouldReload: () => true,
    gcTime: 0,
});

function RouteComponent() {
    const { auth } = useAuth();

    if (!canAccess(["Sales", "Superadmin", "Manager Sales"], auth?.user.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    const router = useRouter();
    const supplier = Route.useLoaderData();
    const { supplier_id } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [, setError] = useAtom(errorAtom);

    const updateSupplierMutation = useMutation({
        mutationFn: (data: SupplierFormType) =>
            api()
                .patch("suppliers/" + supplier_id, { json: data })
                .json(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });

            navigate({ from: "/sales/supplier/edit/$supplier_id", to: "/sales/supplier" });
        },
        onError: async (error: any) => {
            const errorMessage = await getApiErrorMessage(error);
            setError(errorMessage);
        },
    });

    const onSubmit = (data: SupplierFormType) => {
        updateSupplierMutation.mutate(data);
    };

    return (
        <>
            <button
                onClick={() => {
                    if (router.history.length > 1) {
                        router.history.back();
                    } else {
                        navigate({ from: "/sales/supplier/edit/$supplier_id", to: "/sales/supplier" });
                    }
                }}
                className="flex items-center gap-3 mb-4 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
            >
                <ArrowLeft size={16} className="transition-all group-hover:-translate-x-1" />
                Kembali
            </button>
            <div className="my-2 text-xl font-medium dark:text-gray-300">Edit Supplier</div>
            <div className="mt-2 mb-4 text-sm text-gray-700 dark:text-gray-400">Edit Data Supplier</div>

            <div className="p-6 bg-white border border-gray-200 rounded-xl dark:bg-[#30334E] dark:border-gray-600">
                <SupplierForm
                    defaultValues={supplier}
                    onSubmit={onSubmit}
                    onCancel={() => {
                        if (router.history.length > 1) {
                            router.history.back();
                        } else {
                            navigate({ from: "/sales/supplier/edit/$supplier_id", to: "/sales/supplier" });
                        }
                    }}
                    isSubmitting={updateSupplierMutation.isPending}
                />
            </div>
        </>
    );
}
