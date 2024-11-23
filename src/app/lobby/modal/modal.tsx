'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../../context/SocketContext'

import style from './modal.module.css'

interface HelpProps {
  isOpen: boolean
  onClose: () => void
}

const Help: React.FC<HelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const handleOverlayClick = (e: any) => {
    if (e.target.classList.contains(style.overlay)) {
      onClose()
    }
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
