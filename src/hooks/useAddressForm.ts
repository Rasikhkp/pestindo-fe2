import { useState, useCallback, useEffect } from "react";
import regenciesData from "@/assets/regencies.json";
import provincesData from "@/assets/provinces.json";
import districtsData from "@/assets/districts.json";
import { FieldValues, UseFormResetField, UseFormSetValue } from "react-hook-form";

type ProvinceType = { code: number; name: string };
type RegencyType = { code: number; province_code: number; name: string };
type DistrictType = { code: number; regency_code: number; name: string };

const getRegenciesByProvince = (provinceCode: number | string) =>
    provinceCode
        ? regenciesData.filter((regency) => regency.province_code === Number(provinceCode))
        : [];

const getDistrictsByRegency = (regencyCode: number | string) =>
    regencyCode
        ? districtsData.filter((district) => district.regency_code === Number(regencyCode))
        : [];

interface UseAddressFormProps<T extends FieldValues> {
    sourceProvince: number | string;
    sourceRegency: number | string;
    sourceDistrict: number | string;
    sourceDetail: string;
    targetProvince: number | string;
    targetRegency: number | string;
    setValue: UseFormSetValue<T>;
    resetField: UseFormResetField<T>;
}

export function useAddressForm<T extends FieldValues>({
    sourceProvince,
    sourceRegency,
    sourceDistrict,
    sourceDetail,
    targetProvince,
    targetRegency,
    setValue,
    resetField,
}: UseAddressFormProps<T>) {
    // State for managing address data
    const [useSameAddress, setUseSameAddress] = useState(false);
    const [sourceRegencies, setSourceRegencies] = useState<RegencyType[]>(
        sourceProvince ? getRegenciesByProvince(sourceProvince) : []
    );
    const [sourceDistricts, setSourceDistricts] = useState<DistrictType[]>(
        sourceRegency ? getDistrictsByRegency(sourceRegency) : []
    );
    const [targetRegencies, setTargetRegencies] = useState<RegencyType[]>(
        targetProvince ? getRegenciesByProvince(targetProvince) : []
    );
    const [targetDistricts, setTargetDistricts] = useState<DistrictType[]>(
        targetRegency ? getDistrictsByRegency(targetRegency) : []
    );

    // Update source regencies when province changes
    useEffect(() => {
        if (sourceProvince) {
            const regs = getRegenciesByProvince(sourceProvince);
            setSourceRegencies(regs);
        }
    }, [sourceProvince]);

    // Update source districts when regency changes
    useEffect(() => {
        if (sourceRegency) {
            const dists = getDistrictsByRegency(sourceRegency);
            setSourceDistricts(dists);
        }
    }, [sourceRegency]);

    // Update target regencies when province changes
    useEffect(() => {
        if (targetProvince && !useSameAddress) {
            const regs = getRegenciesByProvince(targetProvince);
            setTargetRegencies(regs);
        }
    }, [targetProvince, useSameAddress]);

    // Update target districts when regency changes
    useEffect(() => {
        if (targetRegency && !useSameAddress) {
            const dists = getDistrictsByRegency(targetRegency);
            setTargetDistricts(dists);
        }
    }, [targetRegency, useSameAddress]);

    // Type assertions for field paths to make them compatible with the hook
    const jobAddressRegency = "jobAddress.regency" as any;
    const jobAddressDistrict = "jobAddress.district" as any;
    const billingAddressProvince = "billingAddress.province" as any;
    const billingAddressRegency = "billingAddress.regency" as any;
    const billingAddressDistrict = "billingAddress.district" as any;
    const billingAddressDetail = "billingAddress.detail_address" as any;

    // Handlers for source address fields
    const handleSourceProvinceChange = useCallback(
        (value: string, onChange: (v: string) => void) => {
            onChange(value);
            const regs = getRegenciesByProvince(value);
            setSourceRegencies(regs);
            setSourceDistricts([]);
            resetField(jobAddressRegency);
            resetField(jobAddressDistrict);

            if (useSameAddress) {
                setValue(billingAddressProvince, value);
                resetField(billingAddressRegency);
                resetField(billingAddressDistrict);
            }
        },
        [resetField, setValue, useSameAddress, jobAddressRegency, jobAddressDistrict, billingAddressProvince, billingAddressRegency, billingAddressDistrict]
    );

    const handleSourceRegencyChange = useCallback(
        (value: string, onChange: (v: string) => void) => {
            onChange(value);
            const dists = getDistrictsByRegency(value);
            setSourceDistricts(dists);
            resetField(jobAddressDistrict);

            if (useSameAddress) {
                setValue(billingAddressRegency, value);
                resetField(billingAddressDistrict);
            }
        },
        [resetField, setValue, useSameAddress, jobAddressDistrict, billingAddressRegency, billingAddressDistrict]
    );

    const handleSourceDistrictChange = useCallback(
        (value: string, onChange: (v: string) => void) => {
            onChange(value);

            if (useSameAddress) {
                setValue(billingAddressDistrict, value);
            }
        },
        [setValue, useSameAddress, billingAddressDistrict]
    );

    const handleSourceDetailChange = useCallback(
        (value: string, onChange: (v: string) => void) => {
            onChange(value);

            if (useSameAddress) {
                setValue(billingAddressDetail, value);
            }
        },
        [setValue, useSameAddress, billingAddressDetail]
    );

    // Handlers for target address fields
    const handleTargetProvinceChange = useCallback(
        (value: string, onChange: (v: string) => void) => {
            if (!useSameAddress) {
                onChange(value);
                const regs = getRegenciesByProvince(value);
                setTargetRegencies(regs);
                setTargetDistricts([]);
                resetField(billingAddressRegency);
                resetField(billingAddressDistrict);
            }
        },
        [resetField, useSameAddress, billingAddressRegency, billingAddressDistrict]
    );

    const handleTargetRegencyChange = useCallback(
        (value: string, onChange: (v: string) => void) => {
            if (!useSameAddress) {
                onChange(value);
                const dists = getDistrictsByRegency(value);
                setTargetDistricts(dists);
                resetField(billingAddressDistrict);
            }
        },
        [resetField, useSameAddress, billingAddressDistrict]
    );

    return {
        useSameAddress,
        setUseSameAddress,
        handleSourceProvinceChange,
        handleSourceRegencyChange,
        handleSourceDistrictChange,
        handleSourceDetailChange,
        handleTargetProvinceChange,
        handleTargetRegencyChange,
        sourceRegencies,
        sourceDistricts,
        targetRegencies,
        targetDistricts,
        provinces: provincesData,
    };
} 