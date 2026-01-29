import styles from "./FooterDashboard.module.css";
import StatusIndicator from "./StatusIndicator";

export default function FooterDashboard() {
  return (
    <footer className={styles.footer}>
      <div>
        <strong>GuardQuote</strong>
        <span>Enterprise Security Intelligence</span>
      </div>

      <StatusIndicator />

      <span>© {new Date().getFullYear()}</span>
    </footer>
  );
}
