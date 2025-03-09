import { Link } from "react-router-dom";
import styles from "../AuthForm.module.css";

interface AuthFormLinksProps {
  links: { to: string; label: string }[];
}

const AuthFormLinks: React.FC<AuthFormLinksProps> = ({ links }) => {
  if (!links.length) return null;

  return (
    <div className={styles.links}>
      {links.map(({ to, label }) => (
        <div key={to} className={styles.linkWrapper}>
          <Link to={to} className={styles.link}>
            {label}
          </Link>
        </div>
      ))}
    </div>
  );
};

export default AuthFormLinks;