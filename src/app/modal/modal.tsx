'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import style from './modal.module.css'

interface HelpProps {
  isOpen: boolean
  onClose: () => void
  changeNick: (arg: string) => void
}

const Help: React.FC<HelpProps> = ({ isOpen, onClose, changeNick }) => {
  const [nickname, setNickname] = useState('')
  if (!isOpen) return null

  const handleInputChange = (e: any) => {
    setNickname(e.target.value)
  }

  const handleOverlayClick = (e: any) => {
    if (e.target.classList.contains(style.overlay)) {
      onClose()
    }
  }

  return (
    <div className={style.overlay} onClick={handleOverlayClick}>
      <div className={style.content}>
        <div className={style.text}>
          <input
            onChange={handleInputChange}
            value={nickname}
            maxLength={13}
            className={style.inputText}
            type="text"
          />
        </div>
        <button onClick={() => changeNick(nickname)} className={style.confirm}>
          Подтвердить
        </button>
        <button className={style.close} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default Help
