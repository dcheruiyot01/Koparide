// src/pages/auth/RegisterModal.tsx
import { Register } from "./Register"
import { Modal } from "../../components/modal/modal"

export const RegisterModal = ({ open, onClose }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Register onSuccess={onClose} />
        </Modal>
    )
}
