// src/pages/auth/LoginModal.tsx
import { Login } from "./Login"
import { Modal } from "../../components/modal/modal"

export const LoginModal = ({ open, onClose }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Login onSuccess={onClose} />
        </Modal>
    )
}