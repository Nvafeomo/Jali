import type { ReactNode } from 'react';
import styles from './AuthShell.module.css';

interface AuthShellProps {
  tagline: string;
  children: ReactNode;
  footer: ReactNode;
}

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

      <footer className={styles.footer}>{footer}</footer>
    </div>
  </div>
);

export default AuthShell;
