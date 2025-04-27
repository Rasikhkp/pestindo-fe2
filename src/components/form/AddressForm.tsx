import { Controller, Control } from "react-hook-form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import provincesData from "@/assets/provinces.json";
import { FormSection } from "./FormSection";

interface AddressFormProps {
    control: Control<any>;
    provinceFieldName: string;
    regencyFieldName: string;
    districtFieldName: string;
    detailFieldName: string;
    provinces: any[];
    districts: any[];
    onProvinceChange: (value: string, onChange: (v: string) => void) => void;
    onRegencyChange: (value: string, onChange: (v: string) => void) => void;
    onDistrictChange?: (value: string, onChange: (v: string) => void) => void;
    onDetailChange?: (value: string, onChange: (v: string) => void) => void;
    disabled?: boolean;
    errors?: any;
}

export function AddressForm({
    control,
    provinceFieldName,
    regencyFieldName,
    districtFieldName,
    detailFieldName,
    provinces,
    districts,
    onProvinceChange,
    onRegencyChange,
    onDistrictChange,
    onDetailChange,
    disabled = false,
    errors
}: AddressFormProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <div className="flex flex-col">
                    <FormSection title="Provinsi">
                        <Controller
                            name={provinceFieldName}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value?.toString()}
                                    onValueChange={(val) => onProvinceChange(val, field.onChange)}
                                    disabled={disabled}
                                >
                                    <SelectTrigger className="space-x-2 w-fit min-w-[150px]">
                                        <SelectValue placeholder="Provinsi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {provincesData.map((province: any) => (
                                                <SelectItem key={province.code} value={province.code.toString()}>
                                                    {province.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors?.province && <p className="mt-1 text-xs text-red-500">{errors.province.message}</p>}
                    </FormSection>
                </div>

                <div className="flex flex-col">
                    <FormSection title="Kabupaten">
                        <Controller
                            name={regencyFieldName}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value?.toString()}
                                    onValueChange={(val) => onRegencyChange(val, field.onChange)}
                                    disabled={disabled || !provinces || provinces.length === 0}
                                >
                                    <SelectTrigger className="space-x-2 w-fit min-w-[150px]">
                                        <SelectValue placeholder="Kabupaten" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {provinces?.map((regency: any) => (
                                                <SelectItem key={regency.code} value={regency.code.toString()}>
                                                    {regency.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors?.regency && <p className="mt-1 text-xs text-red-500">{errors.regency.message}</p>}
                    </FormSection>
                </div>

                <div className="flex flex-col">
                    <FormSection title="Kecamatan">
                        <Controller
                            name={districtFieldName}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value?.toString()}
                                    onValueChange={(val) => onDistrictChange ? onDistrictChange(val, field.onChange) : field.onChange(val)}
                                    disabled={disabled || !districts || districts.length === 0}
                                >
                                    <SelectTrigger className="space-x-2 w-fit min-w-[150px]">
                                        <SelectValue placeholder="Kecamatan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {districts?.map((district: any) => (
                                                <SelectItem key={district.code} value={district.code.toString()}>
                                                    {district.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors?.district && <p className="mt-1 text-xs text-red-500">{errors.district.message}</p>}
                    </FormSection>
                </div>
            </div>

            <FormSection title="Detail Alamat">
                <Controller
                    name={detailFieldName}
                    control={control}
                    render={({ field }) => (
                        <Textarea
                            {...field}
                            placeholder="Detail Alamat"
                            disabled={disabled}
                            onChange={(e) => onDetailChange ? onDetailChange(e.target.value, field.onChange) : field.onChange(e.target.value)}
                        />
                    )}
                />
                {errors?.detail_address && <p className="mt-1 text-xs text-red-500">{errors.detail_address.message}</p>}
            </FormSection>
        </div>
    );
} 