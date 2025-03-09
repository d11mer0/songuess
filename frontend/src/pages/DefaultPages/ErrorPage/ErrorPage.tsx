
import { useNavigate } from 'react-router-dom';
import './ErrorPage.css';
import Button  from '../../../components/UI/Button/Button';

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="error-container">
      <h1 className="error-title">404</h1>
      <p className="error-message">Сторінку не знайдено</p>
      <Button variant='danger' onClick={() => navigate('/')}>
        На головну
      </Button>
    </div>
  );
};

export default ErrorPage;
