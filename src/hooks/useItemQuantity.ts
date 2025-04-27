import { useState, useEffect } from "react";
import { UseFormSetValue, UseFormWatch, UseFormTrigger, FieldValues, Path } from "react-hook-form";
import { createItemSchemaWithRequiredNoteAndReason, itemSchema } from "@/schemas/itemSchema";

interface UseItemQuantityProps<T extends FieldValues> {
    watch: UseFormWatch<T>;
    setValue: UseFormSetValue<T>;
    trigger: UseFormTrigger<T>;
    amountField: Path<T>;
    isEdit: boolean;
    initialAmount?: number;
}

export function useItemQuantity<T extends FieldValues>({
    watch,
    setValue,
    trigger,
    amountField,
    isEdit,
    initialAmount = 0,
}: UseItemQuantityProps<T>) {
    const [internalInitialAmount, setInternalInitialAmount] = useState<number>(initialAmount);
    const [amountChanged, setAmountChanged] = useState<boolean>(false);
    const [currentSchema, setCurrentSchema] = useState<any>(itemSchema);

    const amount = watch(amountField);

    // Initialize initial amount
    useEffect(() => {
        if (initialAmount !== undefined) {
            setInternalInitialAmount(initialAmount);
        }
    }, [initialAmount]);

    // Update schema when amount changes
    useEffect(() => {
        const amountHasChanged = amount !== internalInitialAmount;
        setAmountChanged(amountHasChanged);

        // Dynamically change schema validation based on amount change
        if (amountHasChanged && isEdit) {
            setCurrentSchema(createItemSchemaWithRequiredNoteAndReason());
        } else {
            setCurrentSchema(itemSchema);
        }

        // Re-trigger validation when amount changes
        trigger();
    }, [amount, internalInitialAmount, trigger, isEdit]);

    const handleIncrement = () => {
        setValue(amountField, (Number(amount) + 1) as any, { shouldValidate: true });
    };

    const handleDecrement = () => {
        if (Number(amount) > 0) {
            setValue(amountField, (Number(amount) - 1) as any, { shouldValidate: true });
        }
    };

    return {
        amount,
        amountChanged,
        currentSchema,
        handleIncrement,
        handleDecrement
    };
} 