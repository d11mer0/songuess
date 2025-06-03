import TextInput from '../DefaultInputs/TextInput';

interface TextInputAuthProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TextInputAuth: React.FC<TextInputAuthProps> = ({
    label,
    value,
    onChange,
}) => {
    return (
        <TextInput
            name="login"
            label={label}
            value={value}
            onChange={onChange}
            required
        />
    );
};

export default TextInputAuth;
