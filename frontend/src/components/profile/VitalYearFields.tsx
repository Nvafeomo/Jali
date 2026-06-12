import type { BirthMode, LifeStatus } from '../../utils/vitalYears';
import styles from './VitalYearFields.module.css';

interface Props {
  birthMode: BirthMode;
  birthYear: string;
  lifeStatus: LifeStatus;
  deathYear: string;
  onBirthModeChange: (mode: BirthMode) => void;
  onBirthYearChange: (value: string) => void;
  onLifeStatusChange: (status: LifeStatus) => void;
  onDeathYearChange: (value: string) => void;
}

const VitalYearFields = ({
  birthMode,
  birthYear,
  lifeStatus,
  deathYear,
  onBirthModeChange,
  onBirthYearChange,
  onLifeStatusChange,
  onDeathYearChange,
}: Props) => (
  <>
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Birth year</legend>
      <div className={styles.toggleGroup} role="group" aria-label="Birth year">
        <button
          type="button"
          className={birthMode === 'unknown' ? styles.toggleActive : styles.toggle}
          onClick={() => onBirthModeChange('unknown')}
        >
          Unknown
        </button>
        <button
          type="button"
          className={birthMode === 'year' ? styles.toggleActive : styles.toggle}
          onClick={() => onBirthModeChange('year')}
        >
          Known year
        </button>
      </div>
      {birthMode === 'year' && (
        <input
          type="text"
          className={styles.input}
          value={birthYear}
          onChange={e => onBirthYearChange(e.target.value)}
          placeholder="e.g. 1952 or c. 1950"
        />
      )}
    </fieldset>

    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Alive or deceased</legend>
      <div className={styles.toggleGroup} role="group" aria-label="Life status">
        <button
          type="button"
          className={lifeStatus === 'unspecified' ? styles.toggleActive : styles.toggle}
          onClick={() => onLifeStatusChange('unspecified')}
        >
          Not set
        </button>
        <button
          type="button"
          className={lifeStatus === 'alive' ? styles.toggleActive : styles.toggle}
          onClick={() => onLifeStatusChange('alive')}
        >
          Alive
        </button>
        <button
          type="button"
          className={lifeStatus === 'deceased' ? styles.toggleActive : styles.toggle}
          onClick={() => onLifeStatusChange('deceased')}
        >
          Deceased
        </button>
      </div>
      {lifeStatus === 'unspecified' && (
        <p className={styles.hint}>
          Default: we do not assume living or deceased until you choose.
        </p>
      )}
      {lifeStatus === 'alive' && (
        <p className={styles.hint}>Marked as living today.</p>
      )}
      {lifeStatus === 'deceased' && (
        <>
          <label className={styles.subLabel}>
            Death year <span className={styles.optional}>(optional)</span>
            <input
              type="text"
              className={styles.input}
              value={deathYear}
              onChange={e => onDeathYearChange(e.target.value)}
              placeholder="Leave blank if year unknown"
            />
          </label>
          <p className={styles.hint}>
            Deceased with no year stored means death year is unknown, not the same as alive.
          </p>
        </>
      )}
    </fieldset>
  </>
);

export default VitalYearFields;
