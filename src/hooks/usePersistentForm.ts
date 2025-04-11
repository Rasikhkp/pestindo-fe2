import { useForm, UseFormProps, UseFormReturn } from "react-hook-form";

export function usePersistentForm<T extends Record<string, any>>(
    storageKey: string,
    props: Omit<UseFormProps<T>, "defaultValues"> & {
        defaultValues?: Partial<T>;
    }
): UseFormReturn<T> {
    const storedValues = sessionStorage.getItem(storageKey);
    const parsedValues = storedValues ? JSON.parse(storedValues) : props.defaultValues;

    const form = useForm<T>({
        ...props,
        defaultValues: parsedValues,
    });

    // Save form values to localStorage on change
    const values = form.watch();
    sessionStorage.setItem(storageKey, JSON.stringify(values));

    return form;
} 