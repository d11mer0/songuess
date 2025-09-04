import { GoogleLogin } from '@react-oauth/google';
import { useGoogleLoginMutation } from '../../store/api/authApi';
import { useNavigate } from 'react-router';

const GoogleLoginButton: React.FC = () => {
    const [googleLogin] = useGoogleLoginMutation();
    const navigate = useNavigate();

    return (
        <GoogleLogin
            theme="filled_black"
            size="large"
            shape="circle"
            text="continue_with"
            onSuccess={async (response) => {
                try {
                    if (response.credential) {
                        await googleLogin(response.credential).unwrap();
                        navigate('/')
                        
                    } else {
                        throw new Error('No credential received');
                    }
                } catch (error) {
                    console.error('Google login failed:', error);
                    navigate('/error');
                }
            }}
            onError={() => {
                console.error('Google login failed');
                navigate('/error');
            }}
        />
    );
};

export default GoogleLoginButton;
