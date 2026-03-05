// src/pages/auth/RegisterModal.tsx
import { Register } from "./Register.tsx"
import { Modal } from "../../../components/modal/modal.tsx"

export const RegisterModal = ({ open, onClose }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Register onSuccess={onClose} />
        </Modal>
    )
}
