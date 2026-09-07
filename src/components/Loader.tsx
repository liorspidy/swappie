import styles from "./Loader.module.scss";

const Loader = () => {
  return (
    <div className={styles.backdrop}>
        <div className={styles.loader}></div>
    </div>
  )
}

export default Loader