import type { ReactNode } from 'react';
import styles from './AuthShell.module.css';

interface AuthShellProps {
  tagline: string;
  children: ReactNode;
  footer: ReactNode;
}

const TOS_URL = 'https://nvafeomo.github.io/Jali/tos/';
const PP_URL = 'https://nvafeomo.github.io/Jali/privacy-policy/';

const AuthShell = ({ tagline, children, footer }: AuthShellProps) => (
  <div className={styles.page}>
    <div className={styles.backdrop} aria-hidden />
    <div className={styles.card}>
      <header className={styles.brand}>
        <h1 className={styles.logo}>Jali</h1>
        <p className={styles.griot}>Digital griot</p>
        <p className={styles.tagline}>{tagline}</p>
      </header>

      {children}

      <footer className={styles.footer}>
        {footer}
        <p className={styles.legal}>
          <a href={TOS_URL} target="_blank" rel="noopener noreferrer">Terms of Service</a>
          {' · '}
          <a href={PP_URL} target="_blank" rel="noopener noreferrer">Privacy Policy</a>
        </p>
      </footer>
    </div>
  </div>
);

export default AuthShell;
