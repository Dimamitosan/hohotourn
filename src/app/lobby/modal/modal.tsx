'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../../context/SocketContext'

import style from './modal.module.css'

interface HelpProps {
  isOpen: boolean
  onClose: () => void
  leave: boolean
}

const Help: React.FC<HelpProps> = ({ isOpen, onClose, leave }) => {
  if (!isOpen) return null

  const router = useRouter()

  const handleOverlayClick = (e: any) => {
    if (e.target.classList.contains(style.overlay)) {
      onClose()
    }
  }

  const returnButton = () => {
    router.push(`/`)
  }

  if (leave) {
    return (
      <div className={style.overlay_withOut_close} onClick={handleOverlayClick}>
        <div className={`${style.content} ${style.miniContent}`}>
          <p className={style.text}>Данное лобби больше не существует!</p>
          <button className={style.close} onClick={returnButton}>
            Вернуться в главное меню
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={style.overlay} onClick={handleOverlayClick}>
      <div className={style.content}>
        <p>Игра делется на фазы</p>
        <div className={style.text}>
          <ol>
            <li className={style.li}>Список игроков и их очков.</li>
            <li className={style.li}>
              <p>Ввод вопроса</p>
              <p>Этот вопрос попадется двум случайным игрокам.</p>
            </li>
            <li className={style.li}>
              <p>Ввод ответов</p>
              <p>
                Вам достанется по одному вопросу от двух других игроков, вам
                надо на них ответить.
              </p>
            </li>
            <li className={style.li}>
              <p>Голосование </p>
              <p>Выводится один вопрос и два ответа, голосуйте за лучший! </p>
              <p>
                {' '}
                Игроки, чьи ответы представлены на голосовании не голосуют!
              </p>
            </li>
            <li className={style.li}>
              После голосования выводятся имена написавших впорос и ответы, а
              также кто за какой ответ голосовал.
            </li>
          </ol>
        </div>
        <button className={style.close} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default Help
