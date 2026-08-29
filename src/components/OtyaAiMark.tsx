import Image from 'next/image'
import styles from './OtyaAiMark.module.css'

type State = 'idle' | 'thinking' | 'success' | 'offline'

export function OtyaAiMark({ size = 56, state = 'thinking' }: { size?: number; state?: State }) {
  return <span className={`${styles.wrap} ${styles[state]}`} style={{ width: size, height: size }} aria-label="OTYA">
    <Image src="/otya-icon.svg" alt="" width={size} height={size} className={styles.mark} priority={false} />
    {state === 'thinking' && <span className={styles.orbit} aria-hidden="true" />}
  </span>
}
