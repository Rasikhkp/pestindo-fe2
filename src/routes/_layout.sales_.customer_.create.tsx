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

export const Route = createFileRoute("/_layout/sales_/customer_/create")({
    component: RouteComponent,
});

function RouteComponent() {
    const { auth } = useAuth();

    if (!canAccess(["Sales", "Superadmin", "Manager Sales"], auth?.user.role || "")) {
        return <Navigate to="/dashboard" />;
    }

    const router = useRouter();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [, setError] = useAtom(errorAtom);

    const createCustomerMutation = useMutation({
        mutationFn: (data: any) => api().post("customers", { json: data }).json(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            navigate({ from: "/sales/customer/create", to: "/sales/customer" });
        },
        onError: async (error: any) => {
            const errorMessage = await getApiErrorMessage(error);
            setError(errorMessage);
        },
    });

    const buildAddressString = (detail: string, districtCode: string | number, regencyCode: string | number, provinceCode: string | number) => {
        const provinceName = provincesData.find((p) => p.code == provinceCode)?.name;
        const regencyName = regenciesData.find((r) => r.code == regencyCode)?.name;
        const districtName = districtsData.find((d) => d.code == districtCode)?.name;
        return `${detail}, ${districtName}, ${regencyName}, ${provinceName}`;
    };

    const onSubmit = async (data: CustomerFormType) => {
        const billingAddress = buildAddressString(data.detail_address1, data.district1, data.regency1, data.province1);
        const currentAddress = buildAddressString(data.detail_address2, data.district2, data.regency2, data.province2);

        const requestBody = {
            name: data.name,
            type: data.type,
            npwp: data.type === "company" ? data.identificationNumber : null,
            nik: data.type === "individual" ? data.identificationNumber : null,
            npwp_address: data.type === "company" ? billingAddress : null,
            ktp_address: data.type === "individual" ? billingAddress : null,
            address: currentAddress,
            phone: data.phone,
        };

        createCustomerMutation.mutate(requestBody);
    };

    return (
        <>
            <button
                onClick={() => {
                    if (router.history.length > 1) {
                        router.history.back();
                    } else {
                        navigate({ from: "/sales/customer/create", to: "/sales/customer" });
                    }
                }}
                className="flex items-center gap-3 mb-4 text-sm text-gray-600 active:font-semibold dark:text-gray-300 group hover:font-medium"
            >
                <ArrowLeft size={16} className="transition-all group-hover:-translate-x-1" />
                Kembali
            </button>
            <div className="my-2 text-xl font-medium dark:text-gray-300">Tambah Pelanggan</div>
            <div className="mt-2 mb-4 text-sm text-gray-700 dark:text-gray-400">Tambah Daftar Pelanggan Baru</div>
            <CustomerForm
                onSubmit={onSubmit}
                onCancel={() => {
                    if (router.history.length > 1) {
                        router.history.back();
                    } else {
                        navigate({ from: "/sales/customer/create", to: "/sales/customer" });
                    }
                }}
                isSubmitting={createCustomerMutation.isPending} />
        </>
    );
}

export default RouteComponent;
