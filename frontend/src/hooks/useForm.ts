import { useState } from 'react';

const useForm = <T extends Record<string, string>>(initialState: T) => {
    const [formData, setFormData] = useState<T>(initialState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return { formData, handleChange };
};

export default useForm;
