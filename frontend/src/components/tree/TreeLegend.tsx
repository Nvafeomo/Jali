import styles from './TreeLegend.module.css';

const TreeLegend = () => (
  <div className={styles.legend} aria-label="Tree legend">
    <p className={styles.title}>Legend</p>

    <section className={styles.section}>
      <p className={styles.heading}>Person ring (overall confidence)</p>
      <ul>
        <li>
          <span className={styles.swatch} style={{ background: '#4ade80' }} />
          High (70%+)
        </li>
        <li>
          <span className={styles.swatch} style={{ background: '#facc15' }} />
          Medium (40-69%)
        </li>
        <li>
          <span className={styles.swatch} style={{ background: '#f87171' }} />
          Low (&lt;40%)
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.dashed}`} />
          Unknown placeholder
        </li>
      </ul>
    </section>

    <section className={styles.section}>
      <p className={styles.heading}>Avatar colour (biological sex)</p>
      <ul>
        <li>
          <span className={styles.swatch} style={{ background: '#1f4e52' }} />
          Male
        </li>
        <li>
          <span className={styles.swatch} style={{ background: '#5c3030' }} />
          Female
        </li>
        <li>
          <span className={styles.swatch} style={{ background: '#3b3b52' }} />
          Not specified
        </li>
      </ul>
    </section>

    <section className={styles.section}>
      <p className={styles.heading}>Lines between people</p>
      <ul>
        <li>
          <span className={styles.lineParentArrow} />
          Parent → child (arrow points to child)
        </li>
        <li>
          <span className={styles.lineMarriage} />
          Marriage / partnership
        </li>
        <li>
          <span className={`${styles.lineParent} ${styles.dashed}`} />
          Disputed relationship
        </li>
      </ul>
    </section>
  </div>
);

export default TreeLegend;
