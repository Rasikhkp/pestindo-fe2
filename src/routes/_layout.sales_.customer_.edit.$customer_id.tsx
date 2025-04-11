import { createFileRoute, Navigate, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { errorAtom } from "@/store/error";
import { api, canAccess, getApiErrorMessage } from "@/lib/utils";
import { CustomerForm, type CustomerForm as CustomerFormType } from "@/components/customer/CustomerForm";
import provincesData from "@/assets/provinces.json";
import regenciesData from "@/assets/regencies.json";
import districtsData from "@/assets/districts.json";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_layout/sales_/customer_/edit/$customer_id")({
    component: RouteComponent,
    loader: async ({ params }) => {
        try {
            const { data } = await api().get("customers/" + params.customer_id).json<any>();

            const idAddress = data.type === "individual" ? data.ktp_address.split(", ") : data.npwp_address.split(", ");
            const realAddress = data.address.split(", ");

            const province1 = provincesData.find((d) => d.name.toLowerCase() === idAddress[idAddress.length - 1].toLowerCase())?.code;
            const province2 = provincesData.find((d) => d.name.toLowerCase() === realAddress[realAddress.length - 1].toLowerCase())?.code;
            const regency1 = regenciesData.find((d) => d.name.toLowerCase() === idAddress[idAddress.length - 2].toLowerCase())?.code;
            const regency2 = regenciesData.find((d) => d.name.toLowerCase() === realAddress[realAddress.length - 2].toLowerCase())?.code;
            const district1 = districtsData.find((d) => d.name.toLowerCase() === idAddress[idAddress.length - 3].toLowerCase())?.code;
            const district2 = districtsData.find((d) => d.name.toLowerCase() === realAddress[realAddress.length - 3].toLowerCase())?.code;
            const detail_address1 = idAddress[idAddress.length - 4];
            const detail_address2 = realAddress[realAddress.length - 4];

            return {
                type: data.type,
                phone: data.phone,
                identificationNumber: data.npwp || data.nik,
                name: data.name,
                province1,
                province2,
                regency1,
                regency2,
                district1,
                district2,
                detail_address1,
                detail_address2,
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
    const customer = Route.useLoaderData();
    const { customer_id } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [, setError] = useAtom(errorAtom);

    const updateMutation = useMutation({
        mutationFn: (data: any) =>
            api()
                .patch("customers/" + customer_id, { json: data })
                .json(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            navigate({ from: "/sales/customer/edit/$customer_id", to: "/sales/customer" });
        },
        onError: async (error: any) => {
            const errorMessage = await getApiErrorMessage(error);
            setError(errorMessage);
        },
    });

    const onSubmit = async (data: CustomerFormType) => {
        const province1Name = provincesData.find((d) => d.code == data.province1)?.name;
        const province2Name = provincesData.find((d) => d.code == data.province2)?.name;
        const regency1Name = regenciesData.find((d) => d.code == data.regency1)?.name;
        const regency2Name = regenciesData.find((d) => d.code == data.regency2)?.name;
        const district1Name = districtsData.find((d) => d.code == data.district1)?.name;
        const district2Name = districtsData.find((d) => d.code == data.district2)?.name;

        const bodyData = {
            name: data.name,
            type: data.type,
            npwp: data.type === "individual" ? null : data.identificationNumber,
            nik: data.type === "individual" ? data.identificationNumber : null,
            npwp_address: data.type === "individual" ? null : `${data.detail_address1}, ${district1Name}, ${regency1Name}, ${province1Name}`,
            ktp_address: data.type === "individual" ? `${data.detail_address1}, ${district1Name}, ${regency1Name}, ${province1Name}` : null,
            address: `${data.detail_address2}, ${district2Name}, ${regency2Name}, ${province2Name}`,
            phone: data.phone,
        };

        updateMutation.mutate(bodyData);
    };

    return (
        <>
            <button
                onClick={() => {
                    if (router.history.length > 1) {
                        router.history.back();
                    } else {
                        navigate({ from: "/sales/customer/edit/$customer_id", to: "/sales/customer" });
                    }
                }}
                className="flex items-center gap-3 mb-4 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
            >
                <ArrowLeft size={16} className="transition-all group-hover:-translate-x-1" />
                Kembali
            </button>
            <div className="my-2 text-xl font-medium dark:text-gray-300">Edit Pelanggan</div>
            <div className="mt-2 mb-4 text-sm text-gray-700 dark:text-gray-400">Edit Data Pelanggan</div>

            <CustomerForm
                defaultValues={customer}
                onSubmit={onSubmit}
                onCancel={() => {
                    if (router.history.length > 1) {
                        router.history.back();
                    } else {
                        navigate({ from: "/sales/customer/edit/$customer_id", to: "/sales/customer" });
                    }
                }}
                isSubmitting={updateMutation.isPending}
            />
        </>
    );
}

export default RouteComponent;
