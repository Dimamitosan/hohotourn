'use client'

import style from './modal.module.css'

interface WarningProps {
  isOpen: boolean
  onClose: () => void
}

const Warning: React.FC<WarningProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const handleOverlayClick = (e: any) => {
    if (e.target.classList.contains(style.overlay)) {
      onClose()
    }
  }

  return (
    <div className={style.overlay} onClick={handleOverlayClick}>
      <div className={style.content}>
        <p>
          Осталось меньше 3 игроков, дождитесь чтобы кто-то вернулся и
          продолжите игру или начните новую.
        </p>
        <button className={style.close} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default Warning
