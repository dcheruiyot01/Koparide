// src/pages/auth/LoginModal.tsx
import { Login } from "./Login.tsx"
import { Modal } from "../../../components/modal/modal.tsx"

export const LoginModal = ({ open, onClose }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Login onSuccess={onClose} />
        </Modal>
    )
}