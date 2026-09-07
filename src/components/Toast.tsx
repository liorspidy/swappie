import styles from "./Toast.module.scss";
import { CheckCircle2, XCircle } from "lucide-react";
import type { IStatuses } from "../interfaces/data.interface";

const Toast = ({ status }: { status: IStatuses | null }) => {
    if (!status) return null;

    const Icon = status.type === "success" ? CheckCircle2 : XCircle;

    return (
        <div className={`${styles.toast} ${styles[status.type]}`}>
            <Icon size={18} className={styles.icon} />
            {status.message}
        </div>
    );
};

export default Toast;
