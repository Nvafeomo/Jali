import type { BirthMode, DeathStatus } from '../../utils/vitalYears';
import styles from './VitalYearFields.module.css';

interface Props {
  birthMode: BirthMode;
  birthYear: string;
  deathStatus: DeathStatus;
  deathYear: string;
  onBirthModeChange: (mode: BirthMode) => void;
  onBirthYearChange: (value: string) => void;
  onDeathStatusChange: (status: DeathStatus) => void;
  onDeathYearChange: (value: string) => void;
}

const VitalYearFields = ({
  birthMode,
  birthYear,
  deathStatus,
  deathYear,
  onBirthModeChange,
  onBirthYearChange,
  onDeathStatusChange,
  onDeathYearChange,
}: Props) => (
  <>
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Birth year</legend>
      <div className={styles.optionRow}>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="birthMode"
            checked={birthMode === 'unknown'}
            onChange={() => onBirthModeChange('unknown')}
          />
          Unknown
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="birthMode"
            checked={birthMode === 'year'}
            onChange={() => onBirthModeChange('year')}
          />
          Known year
        </label>
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
      {birthMode === 'unknown' && (
        <p className={styles.hint}>Leave as unknown when the birth year is not known.</p>
      )}
    </fieldset>

    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Death / status</legend>
      <div className={styles.optionRow}>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="deathStatus"
            checked={deathStatus === 'living'}
            onChange={() => onDeathStatusChange('living')}
          />
          Living
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="deathStatus"
            checked={deathStatus === 'year'}
            onChange={() => onDeathStatusChange('year')}
          />
          Died (year known)
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="deathStatus"
            checked={deathStatus === 'unknown'}
            onChange={() => onDeathStatusChange('unknown')}
          />
          Death year unknown
        </label>
      </div>
      {deathStatus === 'year' && (
        <input
          type="text"
          className={styles.input}
          value={deathYear}
          onChange={e => onDeathYearChange(e.target.value)}
          placeholder="e.g. 2018"
        />
      )}
      {deathStatus === 'living' && (
        <p className={styles.hint}>Blank death year — this person is treated as living.</p>
      )}
      {deathStatus === 'unknown' && (
        <p className={styles.hint}>Deceased or status unclear, but the death year is not known.</p>
      )}
    </fieldset>
  </>
);

export default VitalYearFields;
